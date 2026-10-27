document.addEventListener("click anywhere", () => {
  const welcomeScreen = document.getElementById("welcomeScreen");
  welcomeScreen.classList.add("zoomIn");

  setTimeout(() => {
    window.location.href = "home.html";
  }, 1200);
});
