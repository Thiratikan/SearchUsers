import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setGitRepos] = useState(mockRepos);
  const [followers, setFollwers] = useState(mockFollowers);

  //request loading
  const [requests, setRequests] = useState(0);

  //error
  const [error, setError] = useState({ show: false, msg: "" });

  const searchGithubUser = async (user) => {
    toggleError();
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      searchGithubUser(response.data);
      const { login, followers_url } = response.data;

      //https://api.github.com/users/thiratikan/repos?per_page=100
      //https://api.github.com/users/thiratikan/followers
      await Promise.allSettled([
        axios(`${rootUrl}/users/${login}/repos?per_page=100`),
        axios(`${followers_url}?per_page=100`),
      ]).then((results) => {
        console.log(results);
        const [repos, followers] = results;
        const status = "fulfilled";
        if (repos.status === status) {
          setGitRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollwers(followers.value.data);
        }
      });
    } else {
      toggleError(true, "there is no user with that username");
    }
  };
  //check rate
  const CheckRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        let {
          rate: { remaining },
        } = data;

        setRequests(remaining);
        //throw error
        if (remaining === 0) {
          toggleError(true, "sorry, you have exeeded your hourly rate limit!");
        }
      })
      .catch((err) => console.log(err));
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  //error
  useEffect(CheckRequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
