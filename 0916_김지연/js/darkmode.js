const btn = document.querySelector("#toggle-box button");

btn.onclick = () => {
    document.body.classList.toggle("dark");
}