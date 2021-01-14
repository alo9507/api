const axios = require('axios')

module.exports = (req, res) => {
  let owner = req.params.owner
  let repo = req.params.repo
  axios
    .post(
      "https://api.github.com/graphql",
      {
        query: `query {
                  repository(owner: "${owner}", name: "${repo}") {
                    name
                    forks(first: 10) {
                      nodes {
                        name
                        owner {
                          login
                          avatarUrl
                        }
                      }
                    }
                  }
                }`
      },
      {
        headers: {
          Authorization: "bearer " + process.env.GITHUB_PERSONAL_ACCESS_TOKEN
        }
      }
    )
    .then(data =>{
      const forks = []
      if (data.data.data.repository) {
        const requests = []
        data.data.data.repository.forks.nodes.forEach(async fork => {
          requests.push(axios.get(`https://${fork.owner.login}.github.io/octobay`).then(res => {
            return {
              username: fork.owner.login,
              repository: fork.name,
              logo: fork.owner.avatarUrl
            }
          }).catch(e => null))
        })
        Promise.all(requests).then(forks => {
          forks = forks.filter(fork => fork)
          res.json(forks)
        })
      } else {
        res.status(500).json({ error: 'Repository not found.'})
      }
    }).catch(error => {
      res.status(500).json({ error})
    })
}
