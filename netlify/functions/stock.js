const https = require('https');

exports.handler = async function(event) {
  const stockId = event.queryStringParameters.id;
  
  return new Promise((resolve) => {
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${stockId}.tw`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: data
        });
      });
    }).on('error', () => {
      resolve({ statusCode: 500, body: 'Error' });
    });
  });
};
