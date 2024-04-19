**States**
    * UI components
        * Sub-UI
            * F for functionailities
                * API calls (if needed)


**Logged out state**
* UI: Nav Bar
    * UI: Heading
    * UI: Login button
        * on click, takes the user to the login page

* UI: Login page
    * UI: Login form - form input - username, password
    * UI: Login form - form btn - login btn
        * F: on submission, verify username & password were entered
        * F: on submission, retrieve form input
            * API: call the Login endpoint with user input
            * API: receive authentication response
            * F: save user info in local storage

    * UI: Create account form - form input - name, username, password
    * UI: Create account form - form btn - create btn
        * F: on submission, verify username & password were entered
        * F: on submission, retrieve user info from elements
            * API: call the Signup endpoint for account creation
            * API: receive authentication response with token
            * API: upon receiving token, call Login endpoint with auth token
            * API: receive auth response

* Content Area
    * API: on page load, asychronously call stories endpoint
    * API: receive an array of article objects from stories endpoint
        * F: Await stories & create UIs upon receiving data
            * UI: Article card - heading - numbering, title, URL, poster
            * UI: Article card - description - description

**Logged in state**
**I am thinking that we can check local storage for current user info; & if logged in, then show these following UI??**
* UI: Nav Bar
    * UI: Submit btn
        * F: onclick, takes the user to the Submit a Story page
            * UI: Submit a Story page
                * UI: Heading
                * UI: Create article form - form input - author, title, url
                * UI: Create article form - form btn - form submit btn
                    * F: upon submission, verify all info is entered
                    * F: upon submission, retrieve form input
                        * API: upon submission, call Stories endpoint with auth token & article info

    * UI: Favorites btn
        * F: onclick, take user to Favorites page
            * API: on page load (**or is it better to be on Favorites btn click???**), retrieve the array of user favorites from login auth response
            * API: iterate through the array; for every element, call the Singular Stories endpoint (**looks like the Stories enpoint only allows specification of count, but is there a better way that doesn't require multiple calls?**)
            * F: await API response, create UI upon receiving data
                * F: if data exists, list articles
                * F: if data is empty, show banner for no favorites

    * UI: My Stories btn
        * (similar to Favorites page, except the array comes from a different property in user auth response)

    * UI: User Account btn
        * F: onclick, take user to the account info page
            * API: on page load / btn click, call the User endpoint
            * F: parse response to have only name, username, created at
            * F: append user info on page

    * UI: Logout btn
        * Reload the index page in logged out state (**is this correct?**)

* *UI: Content Area - no change*
