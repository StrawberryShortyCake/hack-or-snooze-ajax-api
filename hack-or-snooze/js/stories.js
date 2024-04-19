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

export function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  // if a user is logged in, show favorite/not-favorite star
  const showStar = checkFavoriteState(story.storyId); //Boolean(currentUser);
  const $li = document.createElement("li");

  $li.id = story.storyId;
  $li.classList.add("Story", "mt-2");
  $li.innerHTML = `
      <i class="Favorite-icon bi ${showStar ? "bi-star-fill" : "bi-star"}"></i>
      <a href="${story.url}" target="a_blank" class="Story-link">
        ${story.title}
      </a>
      <small class="Story-hostname text-muted">(${hostName})</small>
      <small class="Story-author">by ${story.author}</small>
      <small class="Story-user d-block">posted by ${story.username}</small>
    `;


  return $li;
}

/** Given a story object, it will retrieve the user's favorites list and check
 * whether the specified story is in the array
 */
function checkFavoriteState(newFavoritedStoryId) {
  const favoritesList = currentUser.favorites.map((story) => {
    return story.storyId;
  });
  return favoritesList.includes(newFavoritedStoryId);
}

/**
 * Will check whether the user click is on the favorite icon and then
 * call the icon toggle function
 */
export function handleFavoriteClick(evt) {
  // console.log("handleFavoriteClick");
  const iconElementTarget = evt.target;

  if (iconElementTarget.closest(".Favorite-icon")) {
    const storyId = evt.target.closest(".Story").id;
    favoriteIconToggle(iconElementTarget, storyId);
  }
}

/**
 * Given the icon element and the storyId, this will call the backend
 * to add / remove a story from the favorite list, update the in-memory
 * favorites list, and toggle the favorite icon to fill / unfill
 */
async function favoriteIconToggle(iconElementTarget, storyId) {
  console.log("favoriteIconToggle", storyId);

  if (checkFavoriteState(storyId) === true) {
    const newFavorites = await currentUser.removeFavorite(currentUser, storyId);

    currentUser.favorites = newFavorites.user.favorites;

    iconElementTarget.classList.remove("bi-star-fill");
    iconElementTarget.classList.add("bi-star");

  } else if (checkFavoriteState(storyId) === false) {
    const newFavorites = await currentUser.addFavorite(currentUser, storyId);

    currentUser.favorites = newFavorites.user.favorites;

    iconElementTarget.classList.remove("bi-star");
    iconElementTarget.classList.add("bi-star-fill");

  }
}


/******************************************************************************
 * List all stories
 *****************************************************************************/

/** For in-memory list of stories, generates markup & put on page. */

export function putStoriesOnPage(list = currStoryList.stories,
  displayElement = $allStoriesList) { // TODO: consider how we'd reuse this for faveeeee...
  console.debug("putStoriesOnPage", list);

  displayElement.innerHTML = "";

  for (const story of list) {
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
 * and the currentUser data, call the .addStory method
 * on the currStoryList object, and call displayNewStory() function.
 */

export async function addNewStoryOnSubmit(evt) { // TODO: REMEMBER WE ADDED THIS
  console.debug("addNewStoryOnSubmit", evt);

  evt.preventDefault();

  // creating a querySelector method that is called on the Submit Story Form
  const qs = $submitStoryForm.querySelector.bind($submitStoryForm);

  const userSubmittedAuthor = qs("#NewStoryForm-author").value;
  const userSubmittedTitle = qs("#NewStoryForm-title").value;
  const userSubmittedURL = qs("#NewStoryForm-url").value;

  // check and correctly format user-inputted URL to be acceptable to API // FIXME: require user to put it in correct format instead
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

  const newStory = await currStoryList.addStory(currentUser, newStoryUserInput);

  /**NOTES: JS will call addStory, which the server does its thing, but JS has already moved on without await
  * with await, we told JS to wait for this response before calling displayNewList()
  */
  hidePageComponents();
  $allStoriesList.classList.remove("d-none"); // NOTES: we'd want to reset state on submit
  displayNewStory(newStory);
}

$submitStoryForm.addEventListener("submit", addNewStoryOnSubmit);

/**
 * This is automatically called after the addStory method is called.
 * Will hide the page components, prepend the new story, and show updated list.
 */

function displayNewStory(newStory) { // TODO: REMEMBER WE ADDED THiS
  console.log("displayNewStory", newStory);
  $allStoriesList.prepend(generateStoryMarkup(newStory));

}


