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

const cors = require("cors")({ origin: true });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

exports.youtubeTranscript = onRequest((req, res) => {
  if (!req.query.videoID) {
    res
      .status(400)
      .send({ response: "Bad Request: Did not find video in request." });
    return;
  }

  cors(req, res, () => {
    YoutubeTranscript.fetchTranscript(req.query.videoID)
      .then((response) => {
        res.send(response);
      })
      .catch((err) => {
        res.status(500).send({ response: err.toString() });
        console.error(err);
      });
  });
});

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

exports.streamedEmbedAndUpsert = onRequest(
  {
    timeoutSeconds: 300,
    memory: "1GiB",
  },
  (req, res) => {
    cors(req, res, async () => {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.flushHeaders();

      const sendEventStreamData = (data) => {
        res.write(`${JSON.stringify(data)}\n\n`);
      };

      let { indexName, videoID, query } = req.body;

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

          //   console.log("queryembedding", embedding);

          const searchResult = await search(index, videoID, embedding);

          sendEventStreamData({
            responseCode: "SUCCESS",
            data: { searchResult },
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

            sendEventStreamData({
              responseCode: "SUCCESS",
              data: { searchResult },
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
      }
    });
  }
);
