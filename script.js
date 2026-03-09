async function buscarUsuario(){

let username = document.getElementById("username").value

let resposta = await fetch(`https://api.github.com/users/${username}`)

let dados = await resposta.json()

let resultado = document.getElementById("resultado")

resultado.innerHTML = `
<h2>${dados.login}</h2>
<img src="${dados.avatar_url}" width="120">
<p>Repositorios: ${dados.public_repos}</p>
<p>Seguidores: ${dados.followers}</p>
<a href="${dados.html_url}" target="_blank">Ver perfil</a>
`

}