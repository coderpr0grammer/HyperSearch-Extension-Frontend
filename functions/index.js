/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { YoutubeTranscript } = require("youtube-transcript");
const { PineconeClient } = require("@pinecone-database/pinecone");
const { v4 } = require("uuid");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const cors = require("cors")({
  origin: true,
});

const allowedOrigins = [
  "https://hypersearch-extension-frontend.vercel.app",
  "http://localhost:3000",
];

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.youtubeTranscript = onRequest(
  {
    cors: ["hypersearch-extension-frontend.vercel.app"],
  },
  (req, res) => {
    cors(req, res, () => {
      if (!req.query.videoID) {
        res
          .status(400)
          .send({ response: "Bad Request: Did not find video in request." });
        return;
      }

      YoutubeTranscript.fetchTranscript(req.query.videoID)
        .then((response) => {
          res.send(response);
        })
        .catch((err) => {
          res.status(500).send({ response: err.toString() });
          console.error(err);
        });
    });
  }
);

const getVideoTranscript = async (videoID) => {
  if (!videoID) {
    throw new Error("Missing video ID when trying to get transcript");
  }
  return YoutubeTranscript.fetchTranscript(videoID)
    .then((response) => {
      console.log(response);
      return response;
    })
    .catch((err) => {
      throw new Error(
        `Could not get transcript for video ${videoID} : ` + err.message
      );
    });
};

const getEmbedding = async (input) => {
  const response = await openai.createEmbedding({
    model: "text-embedding-ada-002",
    input: input,
  });

  const { data } = response.data;

  return data[0];
};

const search = async (index, videoID, queryEmbedding) => {
  try {
    const queryResponse = await index.query({
      queryRequest: {
        namespace: videoID,
        vector: queryEmbedding,
        topK: 5,
        // includeValues: true,
        includeMetadata: true,
      },
    });

    return queryResponse;
  } catch (err) {
    throw new Error(err);
  }
};

const reformChunks = (transcript) => {
  const maxChunkLength = 256;
  const combinedChunks = [];
  let currentChunk = { text: "", duration: 0, offset: 0 };

  for (const chunk of transcript) {
    if (
      currentChunk.text.length + chunk.text.length <= maxChunkLength &&
      currentChunk.text.length + chunk.text.length + 1 <= maxChunkLength
    ) {
      currentChunk.text +=
        (currentChunk.text.length > 0 ? " " : "") + chunk.text;
      currentChunk.duration += chunk.duration;
    } else {
      combinedChunks.push(currentChunk);
      currentChunk = { ...chunk };
    }
  }

  if (currentChunk.text.length > 0) {
    combinedChunks.push(currentChunk);
  }

  return combinedChunks;
};

const embedTranscript = async (segments, callback) => {
  for (let [index, segment] of segments.entries()) {
    let { text } = segment;
    let embeddingID = v4();

    text = text.replace(/\n/g, " ");
    console.log("segment...", text);

    const embeddings = await getEmbedding(text).then(
      (result) => result.embedding
    );

    const percentage = Math.floor((index / (segments.length - 1)) * 100);

    callback(segment, embeddings, embeddingID, percentage);
  }
};

const getIndexRef = async (indexName) => {
  const pineconeClient = new PineconeClient();

  await pineconeClient.init({
    apiKey: process.env.PINECONE_API_KEY,
    environment: process.env.PINECONE_ENVIRONMENT,
  });
  let index = pineconeClient.Index(indexName);

  return index;
};

const checkIfNamespaceExists = async (index, namespace) => {
  const queryRequest = {
    queryRequest: {
      namespace: namespace,
      topK: 1,
      vector: new Array(1536).fill(Math.random(0, 1)),
    },
  };

  try {
    const queryResponse = await index.query(queryRequest);
    // console.log(queryResponse);
    // console.log(queryResponse.matches.length);
    if (queryResponse.matches.length < 1) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    throw new Error("Could not query pinecone db: " + err.message); // Concatenate the error message
  }
};

exports.deleteNamespaceVectors = onRequest((req, res) => {
  cors(req, res, async () => {
    const { videoID } = req.body;
    const deleteResponse = await deleteNamespaceVectors(videoID);
    res.send(deleteResponse);
  });
});

exports.deleteNamespaceVectorsGET = onRequest((req, res) => {
  cors(req, res, async () => {
    const { videoID } = req.query;
    const deleteResponse = await deleteNamespaceVectors(videoID);
    res.send(deleteResponse);
  });
});

const deleteNamespaceVectors = async (videoID) => {
  const index = await getIndexRef("video-embeddings");
  const deleteResponse = await index.delete1({
    deleteAll: true,
    namespace: videoID,
  });
  return deleteResponse;
};

const embedMiniLM = async (data) => {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2",
    {
      headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_KEY}` },
      method: "POST",
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  console.log(result);
  return result;
};

const getSummarizedResponse = async (query, searchResult) => {
  const systemPrompt = {
    role: "system",
    content: `Follow these steps to process your final response to the user's query. 
    
    1. Do not actually respond to each step. Only give your summary and speak as if you were speaking to a user.

    2. Read all of the search results provided by the user.

    3. Work out a clear, confident and concise 2 short sentence response to the user's Search Query based on the provided search results, by summarizing.
    `,
  };

  const userPrompt = {
    role: "user",
    content: `

        Search Query: ${query}

        ${searchResult.matches.map((item, index) => {
          return `Search Result ${index}: ${item.metadata.originalText}`;
        })}
      `,
  };

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [systemPrompt, userPrompt],
      max_tokens: 200,
    });

    return completion.data.choices[0].message.content;
  } catch (err) {
    throw new Error(err);
  }
};

exports.streamedEmbedAndUpsert = onRequest(
  {
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  (req, res) => {
    cors(req, res, async () => {
      console.log("request", req.method);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Vary", "Origin");
      res.flushHeaders();

      const sendEventStreamData = (data) => {
        res.write(`${JSON.stringify(data)}\n\n`);
      };

      if (req.method !== "POST") {
        sendEventStreamData({
          responseCode: "ERROR",
          response: "Method not alllowed",
        });
        // res.status(405).send("Method Not Allowed");
        res.end();
        return;
      }

      // if (!allowedOrigins.includes(req.headers.origin)) {
      //   console.log("origin: ", req.headers.origin);
      //   sendEventStreamData({
      //     responseCode: "ERROR",
      //     data: { errorMessage: "Unauthorized request" },
      //   });

      //   // res.status(403).json({ error: "Unauthorized request" });
      //   res.end();
      //   return;
      // }

      let { indexName, videoID, query, subscribedToPro } = req.body;

      try {
        let index = await getIndexRef(indexName);

        const doesNamespaceExist = await checkIfNamespaceExists(index, videoID);

        console.log("does namespace exist", doesNamespaceExist);

        if (doesNamespaceExist) {
          //only query
          console.log("namespace exists");
          //   const deleteResponse = await deleteNamespaceVectors(videoID);
          //   console.log(deleteResponse);

          const { embedding } = await getEmbedding(query);

          // console.log("queryembedding", embedding);

          const searchResult = await search(index, videoID, embedding);

          const summarizedResponse = await getSummarizedResponse(
            query,
            searchResult
          );

          console.log(summarizedResponse);

          sendEventStreamData({
            responseCode: "SUCCESS",
            data: {
              searchResult,
              summarizedResponse,
            },
          });

          res.end();
        } else {
          //upsert and query

          const youtubeTranscriptApiURl = `https://yt-transcript-api.vercel.app/api/?videoID=${videoID}`;

          let transcript = await fetch(youtubeTranscriptApiURl)
            .then((response) => response.json())
            .then((res) => {
              if (res.responseCode == "ERROR") {
                throw new Error(res.response);
              } else {
                return res.response;
              }
            });

          console.log(transcript);
          transcript = reformChunks(transcript);
          let embeddingRefs = [];

          embedTranscript(
            transcript,
            async (segment, embedding, embeddingID, percentage) => {
              const { text, offset } = segment;

              const upsertRequest = {
                vectors: [
                  {
                    id: embeddingID,
                    values: embedding,
                    metadata: {
                      videoID: videoID,
                      originalText: text,
                      timeStamp: offset,
                    },
                  },
                ],
                namespace: videoID,
              };

              embeddingRefs.push(embeddingID);

              await index.upsert({ upsertRequest });
              console.log("done upsert: " + percentage + "%");

              sendEventStreamData({
                responseCode: "SUCCESS",
                data: { percentage },
              });
            }
          ).then(async () => {
            // await sendEventStreamData({
            //   responseCode: "SUCCESS",
            //   data: {
            //     embeddingRefs,
            //   },
            // });

            const { embedding } = await getEmbedding(query);

            const searchResult = await search(index, videoID, embedding);

            const summarizedResponse = await getSummarizedResponse(
              query,
              searchResult
            );

            sendEventStreamData({
              responseCode: "SUCCESS",
              data: {
                searchResult,
                summarizedResponse,
              },
            });

            console.log("ending res");
            res.end();
          });
        }
      } catch (error) {
        console.error("Error:", error.message);
        sendEventStreamData({
          responseCode: "ERROR",
          data: { errorMessage: error.toString() },
        });
        res.end();
      }
    });
  }
);

/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
admin.initializeApp();
const express = require("express");
// const cookieParser = require('cookie-parser')();
const cors2 = require("cors")({ origin: true });
const app = express();

// Express middleware that validates Firebase ID Tokens passed in the Authorization HTTP header.
// The Firebase ID token needs to be passed as a Bearer token in the Authorization HTTP header like this:
// `Authorization: Bearer <Firebase ID Token>`.
// when decoded successfully, the ID Token content will be added as `req.user`.
const validateFirebaseIdToken = async (req, res, next) => {
  functions.logger.log("Check if request is authorized with Firebase ID token");

  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.error(
      "No Firebase ID token was passed as a Bearer token in the Authorization header.",
      "Make sure you authorize your request by providing the following HTTP header:",
      "Authorization: Bearer <Firebase ID Token>"
    );
    res.status(403).json({
      responseCode: "ERROR",
      data: {
        errorMessage: `No Firebase ID token was passed as a Bearer token in the Authorization header.
    Make sure you authorize your request by providing the following HTTP header:
    Authorization: Bearer <Firebase ID Token>`,
      },
    });
    return;
  }

  let idToken;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    functions.logger.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split("Bearer ")[1];
  } else {
    // No authorization header
    res
      .status(403)
      .json({
        responseCode: "ERROR",
        data: { errorMessage: "Unauthorized: No authorization header found." },
      });
    return;
  }

  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    functions.logger.log("ID Token correctly decoded", decodedIdToken);
    req.user = decodedIdToken;
    next();
    return;
  } catch (error) {
    functions.logger.error("Error while verifying Firebase ID token:", error);
    res
      .status(403)
      .json({responseCode: "ERROR", data: { errorMessage: "Unauthorized. Error while verifying Firebase ID token: " + error}});
    return;
  }
};

app.use(cors2);
// app.use(cookieParser);
app.use(validateFirebaseIdToken);

app.post("/", async (req, res) => {
  // @ts-ignore
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendEventStreamData = (data) => {
    res.write(`${JSON.stringify(data)}\n\n`);
  };

  if (req.method !== "POST") {
    sendEventStreamData({
      responseCode: "ERROR",
      response: "Method not alllowed",
    });
    // res.status(405).send("Method Not Allowed");
    res.end();
    return;
  }

  // if (!allowedOrigins.includes(req.headers.origin)) {
  //   console.log("origin: ", req.headers.origin);
  //   sendEventStreamData({
  //     responseCode: "ERROR",
  //     data: { errorMessage: "Unauthorized request" },
  //   });

  //   // res.status(403).json({ error: "Unauthorized request" });
  //   res.end();
  //   return;
  // }

  let { indexName, videoID, query, subscribedToPro } = req.body;

  try {
    let index = await getIndexRef(indexName);

    const doesNamespaceExist = await checkIfNamespaceExists(index, videoID);

    console.log("does namespace exist", doesNamespaceExist);

    if (doesNamespaceExist) {
      //only query
      console.log("namespace exists");
      //   const deleteResponse = await deleteNamespaceVectors(videoID);
      //   console.log(deleteResponse);

      const { embedding } = await getEmbedding(query);

      // console.log("queryembedding", embedding);

      const searchResult = await search(index, videoID, embedding);

      const summarizedResponse = await getSummarizedResponse(
        query,
        searchResult
      );

      console.log(summarizedResponse);

      sendEventStreamData({
        responseCode: "SUCCESS",
        data: {
          searchResult,
          summarizedResponse,
        },
      });

      res.end();
    } else {
      //upsert and query

      const youtubeTranscriptApiURl = `https://yt-transcript-api.vercel.app/api/?videoID=${videoID}`;

      let transcript = await fetch(youtubeTranscriptApiURl)
        .then((response) => response.json())
        .then((res) => {
          if (res.responseCode == "ERROR") {
            throw new Error(res.response);
          } else {
            return res.response;
          }
        });

      console.log(transcript);
      transcript = reformChunks(transcript);
      let embeddingRefs = [];

      embedTranscript(
        transcript,
        async (segment, embedding, embeddingID, percentage) => {
          const { text, offset } = segment;

          const upsertRequest = {
            vectors: [
              {
                id: embeddingID,
                values: embedding,
                metadata: {
                  videoID: videoID,
                  originalText: text,
                  timeStamp: offset,
                },
              },
            ],
            namespace: videoID,
          };

          embeddingRefs.push(embeddingID);

          try {
            await index.upsert({ upsertRequest });
            console.log("done upsert: " + percentage + "%");
  
            sendEventStreamData({
              responseCode: "SUCCESS",
              data: { percentage },
            });
          } catch (err) {
            console.error(err)
            await deleteNamespaceVectors(videoID)

            sendEventStreamData({
              responseCode: "ERROR",
              data: { errorMessage: err },
            });
          }
         
        }
      ).then(async () => {
        const { embedding } = await getEmbedding(query);

        const searchResult = await search(index, videoID, embedding);

        const summarizedResponse = await getSummarizedResponse(
          query,
          searchResult
        );

        sendEventStreamData({
          responseCode: "SUCCESS",
          data: {
            searchResult,
            summarizedResponse,
          },
        });

        console.log("ending res");
        res.end();
      });
    }

  } catch (error) {
    console.error("Error:", error.message);
    sendEventStreamData({
      responseCode: "ERROR",
      data: { errorMessage: error },
    });
    res.end();
  }
});

// This HTTPS endpoint can only be accessed by your Firebase Users.
// Requests need to be authorized by providing an `Authorization` HTTP header
// with value `Bearer <Firebase ID Token>`.
exports.hypersearch = onRequest(app);
