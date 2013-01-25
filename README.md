reclamacoes-br
==============

Os dados disponíveis podem ser encontrados em <http://dados.gov.br/dataset/cadastro-nacional-de-reclamacoes-fundamentadas-procons-sindec>

### Como importar os dados
* `rake data:download` faz um cópia local dos arquivos CSV
* `rake data:import` importa dados do arquivo CSV para a base de dados
* `rake data:generate` gera coleções adicionais a partir dos dados importados

### Como subir o servidor
`shotgun -p <PORT>`

### Live Site
<http://reclamacoes-br.herokuapp.com/>
