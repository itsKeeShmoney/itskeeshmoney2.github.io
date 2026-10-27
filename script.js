document.getElementById("enterBtn").addEventListener("click", () => {
  const video = document.getElementById("welcomeVideo");
  video.classList.add("zoomIn");

  setTimeout(() => {
    window.location.href = "home.html";
  }, 1200);
});
