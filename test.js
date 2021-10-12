const axios = require("axios-https-proxy-fix").default;
const translate = require("translate-google-api");
const request = require("request");
const tunnel = require("tunnel")
const tunnelProxy = tunnel.httpsOverHttp({
    proxy: {
        host: "127.0.0.1",
        port: 7890
    }
})

async function trans() {
    let a = await translate("你好", {
      tld: "cn",
      to: "en",
      proxy: false,
      httpAgent: tunnelProxy
    })
    .catch(e => {
        console.log(e)
    });
//   let a = await axios.get("https://translate.google.cn/translate_a/single", {
//     timeout: 3000,
//     params: {
//       client: "at",
//       sl: "zh-CN",
//       tl: "en",
//       dt: "t",
//       q: "你好g哈哈哈",
//     },
//     proxy: {
//         host: "127.0.0.1",
//         port: 7890
//     },
//   }).catch(e => console.log(e));
  //   let a = await request(
  //       "https://translate.google.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&ie=UTF-8&oe=UTF-8&otf=1&ssel=0&tsel=0&kc=7&tk=879267.879267&q=shit",
  //       {
  //           timeout: 3000,
  //           proxy: "http://127.0.0.1:7890"
  //       },(error, resp, body) => {
  //           if(error) return
  //           console.log(resp)
  //       })
    console.log(a.data);
}
//需要对所有代码块中的东西加以保护

const headingRegex = /(#+)([^\n]+)/g
const listRegex = /[-|*|+][ ]+([^\s]*)/g;

const paragraphRegex =  /([^\n]+)\n/g
const s ="## Hello\n- fucking\n- sex\n- shit\n- noway\n-  skipit\n### lo\nsafdvdfvdsa\n"

s.replace(paragraphRegex, (match, p1 , offset, raw) => {
    console.log(`offset: ${offset}\n${match.length}, ${p1.length}, ${p1}\nend`)
    if(p1.match(listRegex)){
        console.log("Found a list", listRegex.exec(p1))
    } 
})  

// trans();