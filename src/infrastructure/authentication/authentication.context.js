import React, { createContext, useState, useEffect } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
  where,
  query,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db, app } from "../../utils/firebaseConfig";
import { useNavigate, useLocation } from "react-router";
import { createSearchParams } from "react-router-dom";
import { navigateWithQueryVars } from "../../utils/navigateWithQueryVars";

export const AuthenticationContext = createContext();

const AuthenticationContextProvider = ({ children }) => {
  const auth = getAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [uid, setUid] = useState(null);
  const [userData, setUserData] = useState(null);
  const [subscribedToPro, setSubscribedToPro] = useState(false);
  const [searchesToday, setSearchesToday] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const [lifetimeSearches, setLifetimeSearches] = useState(0);
  const freeLimit = 10;
  const [isAdmin, setIsAdmin] = useState(false)



  const updateUserData = async (params) => {
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, params)
  }

  const startDataListeners = (u) => {
    const customersRef = collection(db, "customers");
    const customerDoc = doc(customersRef, auth.currentUser.uid);
    const subscriptionsCollection = collection(customerDoc, "subscriptions");
    const subscriptionQuery = query(
      subscriptionsCollection,
      where("status", "in", ["trialing", "active"])
    );

    onSnapshot(subscriptionQuery, async (snapshot) => {

      console.log(snapshot.empty)
      if (snapshot.empty) {
        //not subscribed

        getUserData2(auth.currentUser);

        // getUserData();
      } else {
        //subbed
        const subscription = snapshot.docs[0].data();
        getUserData2(auth.currentUser);

        setSubscribedToPro(true);
      }
    });


  };


  const getUserData2 = async (u) => {
    const docRef = doc(db, "users", auth.currentUser.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docSnapData = docSnap.data()
      // console.log("Document data 2:", docSnap.data());
      // console.log(docSnap.data());
      setUserData(docSnapData)
      setSearchesToday(docSnapData.searchesToday)
      setLifetimeSearches(docSnapData.lifetimeSearches)
      setIsAdmin(auth.currentUser.email === 'danielgorg9@gmail.com')


      const lastSearchesReset = docSnapData.lastSearchesReset;

      const d = new Date();
      const today = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      console.log('reset', lastSearchesReset, today)

      if (lastSearchesReset !== today) {
        await updateUserData({ searchesToday: 0, lastSearchesReset: today })
      }

    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");

    }
  }

  const getUserData = async (u) => {
    const docRef = doc(db, "users", u.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docSnapData = docSnap.data()
      // console.log("Document data 2:", docSnap.data());
      // console.log(docSnap.data());
      setUserData(docSnapData)
      setSearchesToday(docSnapData.searchesToday)
      setLifetimeSearches(docSnapData.lifetimeSearches)
      setIsAdmin(u.email == 'danielgorg9@gmail.com')

      const lastSearchesReset = docSnapData.lastSearchesReset;

      const d = new Date();
      const today = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
      console.log(lastSearchesReset, today)


      if (lastSearchesReset != today) {
        updateUserData({ searchesToday: 0, lastSearchesReset: today })
      }

    } else {
      // doc.data() will be undefined in this case
      console.log("No such document!");

    }
  }

  useEffect(() => {

    auth.onAuthStateChanged((u) => {
      if (location.pathname != "/popup") {
        if (u) {
          // console.log("changed: ", u);
          setUser(u);
          setUid(u.uid);
          // console.log("params: ", new URLSearchParams(new URL(window.location.href).search).get('vid'))
          startDataListeners(u);
          navigateWithQueryVars(navigate, '/')
        } else {
          navigateWithQueryVars(navigate, '/login')

        }
      }
    });
  }, [])


  return (
    <AuthenticationContext.Provider
      value={{
        user,
        setUser,
        uid,
        setUid,
        subscribedToPro,
        setSubscribedToPro,
        userData,
        setUserData,
        updateUserData,
        getUserData,
        searchesToday,
        setSearchesToday,
        freeLimit,
        limitReached,
        setLimitReached,
        lifetimeSearches,
        setLifetimeSearches,
        isAdmin,
        setIsAdmin
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export default AuthenticationContextProvider;
