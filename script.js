fetch("https://YOUR-AZURE-APP.azurewebsites.net/api/products")
  .then(res => res.json())
  .then(products => {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = products.map(p => `
      <div class="productCard">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>$${p.price}</p>
      </div>
    `).join("");
  });
