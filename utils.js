const puppeteer = require('puppeteer');
let request = require('request-promise-native');


const vmall_url = 'http://vmall.com';

// https://www.kuaidaili.com/usercenter/

// 添加headers
const headers = {
    'Accept-Encoding': 'gzip'
};
// 隧道代理服务器host/ip和端口
let proxy_ip = 'xxx';
let proxy_port = 16819;

// 隧道id,密码 (可到会员中心查看)
const mytid = 'xxx';
const password = 'xxx';

const sleep = time => new Promise(resolve => {
    setTimeout(resolve, time);
});

async function launchBrowser(proxyServer, proxyPort) {
    return await puppeteer.launch({
        headless: true,
        slowMo: 2000,
        dumpio: true,
        args: [`--proxy-server=${proxy_ip}:${proxy_port}`, '--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960'],
        ignoreDefaultArgs: ["--enable-automation"]
    });
}


async function closeBrowser(browser) {
    await browser.close();
}


async function attachBrowser() {
    let version = await request({
        uri: "http://127.0.0.1:9222/json/version",
        json: true
    });
    return await puppeteer.connect({
        browserWSEndpoint: version.webSocketDebuggerUrl
    });
}

async function detachBrowser(browser) {
    await browser.disconnect();
}


async function gotoPage(browser, url) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders(headers);
    await page.authenticate({mytid: mytid, password: password});
    await interceptRequest(page);
    await page.goto(url, {
        waitUntil: 'networkidle2'
    });
    await sleep(1000);
    return page;
}

async function gotoPageWithoutIntercept(browser, url) {
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders(headers);
    await page.authenticate({mytid: mytid, password: password});
    await page.goto(url, {
        waitUntil: 'networkidle2'
    });
    await sleep(1000);
    return page;
}

async function interceptRequest(page) {
    const blockTypes = new Set(['image', 'media', 'font']);
    await page.setRequestInterception(true); //开启请求拦截
    page.on('request', request => {
        const type = request.resourceType();
        const shouldBlock = blockTypes.has(type);
        if (shouldBlock) {
            //直接阻止请求
            return request.abort();
        } else if (request.url().startsWith('https://res10.vmallres.com/20200313/js/??')) {
            return request.abort();
        } else {
            //对请求重写
            console.log(request.url());
            // return request.continue({
            //     //可以对 url，method，postData，headers 进行覆盖
            //     headers: Object.assign({}, request.headers(), {
            //         'puppeteer-test': 'true'
            //     })
            // });
            return request.continue({
                //可以对 url，method，postData，headers 进行覆盖
                headers: Object.assign({}, request.headers())
            });
            // return request.continue();
        }
    });
}

async function parseCategory(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    let nodeItemsValue = await page.$$eval('.category-list>li>div>div>a', eles => eles.map(ele => ele.text.trim()));
    await page.close();
    await closeBrowser(browser);
    return nodeItemsValue;

}


async function parsePhoneSeries(url) {
    try {
        const browser = await launchBrowser();
        const page = await gotoPage(browser, url);
        let nodeItems = await page.$$eval('#zxnav_0 li.subcate-item>a', eles => eles.map(ele => {
            let _obj = {};
            _obj.url = ele.href.trim();
            _obj.name = ele.text.trim();
            return _obj;
        }));
    } catch (err) {
        console.error(err.message);
    } finally {
        await page.close();
        await browser.close();
    }
    return nodeItems;
}


async function parsePhoneProducts(url) {
    const browser = await launchBrowser();
    const page = await gotoPageWithoutIntercept(browser, url);
    await page.waitFor('#pro-list');
    let nodeItems = await page.$$eval('ul#pro-list>li>div>a', eles => eles.map(ele => {
        let _obj = {};
        _obj.name = ele.title.trim();
        _obj.url = ele.href.trim();
        return _obj;
    }));
    await page.close();
    await browser.close();
    return nodeItems;
}

async function parsePhoneSKU(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    // await page.waitFor('#pro-skus');
    // let dlItems = await page.$$eval('#pro-skus>dl', eles => eles.map(ele => ele.className.indexOf('hide') === -1 ? ele : null));
    // let activeNodes = [];
    try {
        let dlNodes = await page.$$('#pro-skus>dl');
    } catch (error) {
        console.log(error);
    }
    // let classValue = await (await dlNodes[0].getProperty('class')).jsonValue();
    console.log('1')

    // let activeNodes = dlNodes.map(ele => ele.className.indexOf('hide') === -1 ? ele : null);
    // if (activeNodes.length === 3) {
    //     console.log('3')
    //     firstli
    // } else if (activeNodes.length === 4) {
    //     console.log('4');
    // } else {
    //     console.log('not right');
    // }
    // let dlItemList = await item.$$('div>ul>li', eles => eles);
    await page.close();
    await browser.close();
    // return dlNodes;
}


async function testGetNodeText(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    let nodeText = await page.$$eval('h3', eles => eles.map(ele => ele.innerText.trim()))
    await page.close();
    await browser.close();
    return nodeText;
}

async function testGetNodeClass(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    let nodeClass = await page.$$eval('li', eles => eles.map(ele => ele.className.indexOf('hide') === -1 ? ele : null))
    await page.close();
    await browser.close();
    return nodeClass;
}

function testMap(alist) {
    return alist.map(e => 2 * e && e + 1)
}

async function selfNode(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    let button_node = await page.$('button');
    let selfItem = await button_node.jsonValue();
    // await botton_node.click();
    // await page.wait(2*100);
    await page.click('button');
    await page.close();
    await browser.close();
}

async function testNode(url) {
    const browser = await launchBrowser();
    const page = await gotoPage(browser, url);
    // let botton_node = await page.$('button');
    // await botton_node.click();
    // await page.wait(2*100);
    await page.click('button');
    await page.close();
    await browser.close();
}

// parsePhoneSeries(vmall_url);
// testGetNodeClass('http://127.0.0.1:5050')

// https://www.vmall.com/product/10086024821187.html
// parsePhoneSKU('https://www.vmall.com/product/10086024821187.html');

// parsePhoneProducts('https://www.vmall.com/list-275')
// parsePhoneSeries('http://vmall.com');
// console.log('hello')
