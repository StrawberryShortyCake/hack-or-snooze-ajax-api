const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class Story {
  /** Make instance of Story from data object about story:
   *   - {storyId, title, author, url, username, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.updatedAt = "";
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Static method to fetch a story from the API.
   *
   * Accepts:
   *  - storyId: string
   *
   * Returns: new Story instance of the fetched story.
   */
  static async getStory(storyId) {
    const response = await fetch(`${BASE_URL}/stories/${storyId}`);
    const data = await response.json();
    const storyData = data.story;
    return new Story(storyData);
  }

  /** Parses hostname out of URL and returns it.
   *
   * http://foo.com/bar => foo.com
   *
   */

  getHostName() {

    const storyURL = new URL(this.url);
    const hostName = storyURL.hostname;

    return hostName;
  }

}

/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 *****************************************************************************/

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. We don't really need the instance,
    // but we keep it in the class for the organization

    // query the /stories endpoint (no auth required)
    const response = await fetch(`${BASE_URL}/stories`);
    const data = await response.json();

    // turn plain old story objects from API into instances of Story class
    const stories = data.stories.map((s) => new Story(s));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Send story data to API, make a Story instance, update the memory storylist,
   *  and return the new story instance
   *
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStoryInfo) {

    // put the user and newStory parameter into the accepted request format
    const postRequestBody = {
      "token": user.loginToken,
      "story": {
        "author": newStoryInfo.author,
        "title": newStoryInfo.title,
        "url": newStoryInfo.url
      }
    };

    // calling the Stories endpoint, returns JSON
    const responseJSON = await fetch(
      "https://hack-or-snooze-v3.herokuapp.com/stories",
      {
        method: "POST",
        body: JSON.stringify(postRequestBody)
      }
    );

    // turn response JSON into an object representing the newly added story
    const responseData = await responseJSON.json();
    console.log("called the add story post", responseData);

    // format the response data to be passed into the Story class constructor
    const storyData =
    {
      storyId: responseData.story.storyId,
      title: responseData.story.title,
      author: responseData.story.author,
      url: responseData.story.url,
      username: responseData.story.username,
      createdAt: responseData.story.createdAt
    };

    const newStory = new Story(storyData);
    this.stories.unshift(newStory);
    return newStory;
    // NOTES: we have updated the server story list, but we don't have the new story list in memory
    // also check what class this is defined on for the this context
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 *****************************************************************************/

/**
 * Template for creating a new user instance, given a username, name, and token
 */
class User {
  constructor(
    {
      username,
      name,
      createdAt,
      favorites = [],
      ownStories = [],
    },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map((s) => new Story(s));
    this.ownStories = ownStories.map((s) => new Story(s));

    // store login token on the user so that it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const body = JSON.stringify({ user: { username, password, name } });
    const resp = await fetch(`${BASE_URL}/signup`, { method: "POST", body });
    if (!resp.ok) {
      throw new Error("Signup failed");
    }
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** Login in user with API, make User instance & return it.
     * - username: an existing user's username
     * - password: an existing user's password
     */

  static async login(username, password) {
    const body = JSON.stringify({ user: { username, password } });
    const resp = await fetch(`${BASE_URL}/login`, { method: "POST", body });
    if (!resp.ok) throw new Error("Login failed");
    const data = await resp.json();
    const { user, token } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   *   Returns new user (or null if login failed).
   */

  static async loginViaStoredCredentials(token, username) {
    const qs = new URLSearchParams({ token });
    const response = await fetch(`${BASE_URL}/users/${username}?${qs}`);
    if (!response.ok) {
      console.error("loginViaStoredCredentials failed");
      return null;
    }
    const data = await response.json();
    const { user } = data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories,
      },
      token,
    );
  }

  /**
   * Given the current user info and an user selected story,
   * will call the API to add the story to the favorited array in database,
   * and then update the memory favorites array TODO: need to update DOM in Stories.js
   */
  async addFavorite(user, favoritedStoryId) {
    console.log("add favorite");
    const username = user.username;
    const postRequestBody = { "token": user.loginToken };

    // making a POST request, will throw error if it is rejected by server.
    // Otherwise, will parse the response JSON to return the new user
    const responseData = await fetch(
      `${BASE_URL}/users/${username}/favorites/${favoritedStoryId}`,
      {
        method: "POST",
        body: JSON.stringify(postRequestBody)
      }
    ).then((response) => { // TODO: is this the right way to check if the request is successful?
      if (response.ok) {
        return response.json();
      }
      throw new Error('failed to favorite story');
    })
      .catch((error) => {
        console.log(error);
      });

    return responseData;

    // TODO: verify if this is good: option 1 return the new user object, find fave array, and prepend item at length
  }

  /**
    * Given the current user info and an user selected story,
    * will call the API to remove it from the favorited array in the database,
    * and then update the memory favorites array TODO: need to update DOM in Stories.js
    */

  async removeFavorite(user, favoritedStoryId) {
    console.log("delete favorite");
    const username = user.username;
    const postRequestBody = { "token": user.loginToken };

    // making a POST request, will throw error if it is rejected by server
    const responseData = fetch(
      `${BASE_URL}/users/${username}/favorites/${favoritedStoryId}`,
      {
        method: "DELETE",
        body: JSON.stringify(postRequestBody)
      }
    ).then((response) => { // TODO: is this the right way to check if the request is successful?
      if (response.ok) {
        return response.json();
      }
      throw new Error('failed to favorite story');
    })
      .catch((error) => {
        console.log(error);
      });
    return responseData;
  }
}

export { Story, StoryList, User, BASE_URL };
