/*
$("body").append(`  <a class="popup-with-zoom-anim" href="#small-dialog" id="popupauth-modal">Popup Auth</a>
  <div id="small-dialog" class="zoom-anim-dialog dialog-with-tabs mfp-hide">
      <div class="sign-in-form">

          <ul class="popup-tabs-nav">
              <li class="active"><a href="#login">Sign In</a></li>
              <li class=""><a href="#register">Create Account</a></li>
          </ul>

          <div class="popup-tabs-container">

              <div class="popup-tab-content" id="login">
                  <div class="welcome-text">
                      <h3>Sign in to brainstr</h3>
                  </div>

                  <form method="post" id="send-pm">
                      <input type="text" placeholder="Email address" required />
                      <input type="password" placeholder="Password" required />
                  </form>

                  <button class="button full-width">Sign In</button>
              </div>


              <div class="popup-tab-content" id="register">
                  <div class="welcome-text">
                      <h3>Create free account</h3>
                  </div>

                  <form method="post" id="send-pm">
                      <input type="text" placeholder="Email address" required />
                      <input type="password" placeholder="Password" required />
                  </form>

                  <button class="button full-width">Create Account</button>
              </div>

          </div>
      </div>
  </div>`);



$('#popupauth-modal').click();
*/