// This is the global list of all stories (an instance of StoryList)
import {
  $allStoriesList,
  $storiesLoadingMsg,
  $submitStoryForm
} from "./dom";
import { Story, StoryList } from "./models";
import { currentUser } from "./user";
import { hidePageComponents } from "./main"; // added this

export let currStoryList;

/******************************************************************************
 * Generating HTML for a story
 *****************************************************************************/

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns DOM object for the story.
 */

export function generateStoryMarkup(story) { // TODO: let's reuse this for Faves
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const showStar = getFavorites().includes(story.storyId); //Boolean(currentUser);
  const $li = document.createElement("li");

  $li.id = story.storyId;
  $li.classList.add("Story", "mt-2"); // TODO: REMEMBER WE ADDED STARS
  $li.innerHTML = `
      <i class="Favorite-icon bi ${showStar ? "bi-star-fill" : "bi-star"}"
      data-icon-active=${showStar}></i>
      <a href="${story.url}" target="a_blank" class="Story-link">
        ${story.title}
      </a>
      <small class="Story-hostname text-muted">(${hostName})</small>
      <small class="Story-author">by ${story.author}</small>
      <small class="Story-user d-block">posted by ${story.username}</small>
    `;


  return $li;
}

// when called, will return the IDs for user's favorited stories in an array
function getFavorites() {
  // console.log("getFavorites", currentUser.favorites);
  return currentUser.favorites.map((story) => {
    return story.storyId;
  });
}

/**
 * Called when a user clicks on the area of the Stories list.
 * Will toggle the favorite star icon to fill / unfill if the user clicked
 * on the star icon.
 */
export function handleFavoriteClick(evt) { // TODO: REMEMBER WE ADDED THIS
  console.log("handleFavoriteClick");
  getFavorites();
  const iconElementTarget = evt.target;

  /**  if the user clicked the favorite icon, get the icon element,
   * the story ID associated, change the icon toggle state, and call
   * the iconToggle function with these arguments.
  */
  if (iconElementTarget.closest(".Favorite-icon")) {
    console.log("user favorited article");
    const storyId = evt.target.closest(".Story").id;
    const iconState = iconElementTarget.closest(".Favorite-icon")
      .getAttribute("data-icon-active");
    favoriteIconToggle(iconElementTarget, storyId, iconState);
  }
}

async function favoriteIconToggle(iconElementTarget, storyId, iconState) {
  console.log("favoriteIconToggle", storyId, iconState);

  // check whether iconState is true; remove favorite if true; add if false
  switch (iconState === "true") {
    case true:
      await currentUser.removeFavorite(currentUser, storyId);
      displayNewList(); // TODO: check if we should refresh page to reload list?
      break;
    case false:
      await currentUser.addFavorite(currentUser, storyId);
      displayNewList();// TODO: check if we should  refresh page to reload list?
      break;
  }
}

/******************************************************************************
 * List all stories
 *****************************************************************************/

/** For in-memory list of stories, generates markup & put on page. */

export function putStoriesOnPage(list = currStoryList,
  displayElement = $allStoriesList) { // TODO: consider how we'd reuse this for faveeeee...
  console.debug("putStoriesOnPage", list);

  displayElement.innerHTML = "";

  for (const story of list.stories) { // FIXME: need to pass in an object with key stories
    const $story = generateStoryMarkup(story);
    displayElement.append($story);
  }

  displayElement.classList.remove("d-none");
}


/******************************************************************************
 * Start: show stories
 *****************************************************************************/

/** Get and show stories when site first loads. */

export async function fetchAndShowStoriesOnStart() {
  currStoryList = await StoryList.getStories();
  // let newStory = await currStoryList.addStory(currentUser,
  //   { title: "Test", author: "Me", url: "http://meow.com" }); // TODO: is this how we were supposed to test it?
  // let story = await currStoryList.stories[0];
  // currentUser.removeFavorite(currentUser, story);
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}


/**
 * On New Story Form submission, this will retrieve the data from the form
 * and the currentUser data, and call the .addStory method
 * on the currStoryList object.
 */

export async function addNewStoryOnSubmit(evt) { // TODO: REMEMBER WE ADDED THIS
  console.debug("addNewStoryOnSubmit", evt);

  evt.preventDefault();

  // creating a querySelector method that is called on the Submit Story Form
  const qs = $submitStoryForm.querySelector.bind($submitStoryForm);

  const userSubmittedAuthor = qs("#NewStoryForm-author").value;
  const userSubmittedTitle = qs("#NewStoryForm-title").value;
  const userSubmittedURL = qs("#NewStoryForm-url").value;

  // check and correctly format user-inputted URL to be acceptable to API
  const URIprefix = 'http://';
  const formattedURL =
    (userSubmittedURL.substr(0, URIprefix.length) !== URIprefix) ?
      URIprefix + userSubmittedURL : userSubmittedURL;

  // format user form input so that it can be passed into the addStory method
  const newStoryUserInput = {
    author: userSubmittedAuthor,
    title: userSubmittedTitle,
    url: formattedURL
  };

  await currStoryList.addStory(currentUser, newStoryUserInput);
  /**NOTES: JS will call addStory, which the server does its thing, but JS has already moved on without await
  * with await, we told JS to wait for this response before calling displayNewList()
  */
  displayNewList();
}

$submitStoryForm.addEventListener("submit", addNewStoryOnSubmit);

/**
 * This is automatically called after the addStory method is called.
 * Will hide the page components and call the fetchAndShowStoriesOnStart()
 * function again, with the new list of stories
 */

function displayNewList() { // TODO: REMEMBER WE ADDED THiS
  console.log("displayNewList");
  hidePageComponents();
  fetchAndShowStoriesOnStart();
}


