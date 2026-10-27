document.getElementById("enterBtn").addEventListener("click", () => {
  const welcomeScreen = document.getElementById("welcomeScreen");

  // Add the zoom-in class when the button is clicked
  welcomeScreen.classList.add("zoomIn");

  // Wait for the animation to finish, then go to the next page
  setTimeout(() => {
    window.location.href = "home.html"; // change to your next page
  }, 1200); // matches CSS transition duration
});
