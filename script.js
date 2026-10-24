document.getElementById("enterBtn").addEventListener("click", () => {
  const screen = document.getElementById("welcomeScreen");
  screen.classList.add("zoomIn");

  setTimeout(() => {
    window.location.href = "home.html"; 
  }, 1200);
});
