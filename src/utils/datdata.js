import axios from 'axios'

export async function findOrganization (query) {
  const options = {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: 'Token ' + process.env.DATDATA_API_KEY
    },
    body: JSON.stringify({ query })
  }

  axios.post(
    'http://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party',
    options.body,
    {
      headers: options.headers,
      method: options.method
    }
  )
    .then((response) => {
      const data = response.data
      if (data.suggestions.length > 0) {
        const result = data.suggestions.map((item) => {
          return {
            inn: item.data.inn,
            name: item.value,
            kpp: item.data.kpp
          }
        })
        console.log(result)
        return result
      } else {
        return []
      }
    })
    .catch((error) => {
      console.error('Error:', error)
      return []
    }
    )
}
