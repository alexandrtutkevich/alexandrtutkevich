 oSpP = false;

function oSendpulsePush(){
    var sAppUrl = "https://alexandrtutkevich.github.io";   // сайт клиента
    var sOrigUrl = "https://alexandrtutkevich.github.io";
    var bHttps = false;                     // https или http
    var bSendToParent = "false";
    var aBrowser = {};                      // название текущего браузера и версия
    var sBrowser = '';                      // название текущего браузера и версия
    var sSafariPushId = "web.com.sendpulse.push";   // ID from Apple push settings
    var sServerApi = "https://sendpulse.com:4434";  // URL сервера по обработке запросов от клиентов
    var gcmServer = "https://android.googleapis.com/gcm/send/";
    var bAutoSubscribe = true;             // автоподписка при разрешении
    var sAppKey = 'c1bd7b59b04b133e3ecbc12fda0a1a8d';
    var prompt_settings = "";
    var prompt_title = "";
    var prompt_text = "";
    var prompt_description = "Разрешите сайту alexandrtutkevich.github.io отправлять вам уведомления на рабочий стол";
    var currentDB = null;
    var parentEvent = null;
    var initedPage = false;
    var parentVariables = {};
    var pushedVariables = {};
    var pushedInterval = false;
    var sFirefoxServer = "https://updates.push.services.mozilla.com/push/";
    var bWasPrompt = false;
    var startTime = 0;
    var isParentAutoSubscribe = "false"; // true только в случае, если сайт is_ssl=0 и is_autosubscribe=1 false
    var bSentToServer = false;
    var bSentStatOpened = false;
    var bSentStatPermission = false;
    var bMobileEnabled = "true";
    var show_splogo = "1";
    var spdomain_website = "www.login.sendpulse.dev";
    var aPoweredbySendpulse = {
        ru: 'Предоставлено SendPulse',
        en: 'Powered by SendPulse',
        ua: 'Надано SendPulse'
    }
    //******************************************************************************************************************
    this.start = function(){
        if (! oSpP.detectSite()) {
            oSpP.log('Application allowed only for '+sAppUrl);
            return false;
        }
        if (oSpP.detectOs()=='iOS') {
            oSpP.log('Application can not work on iOS');
            return false;
        }

        var sOs = oSpP.detectOs();
        if (! bMobileEnabled) {
            if ( (sOs=='iOS')||(sOs=='Android') ){
                oSpP.log('Application disabled for your device');
                return false;
            }
        }

        oSpP.detectHttps();
        aBrowser = oSpP.detectBrowser(); // from Chrome.42, Firefox 44
        sBrowser = aBrowser['name'].toLowerCase();

        if ((sBrowser == 'firefox')&&(parseFloat(aBrowser['version'])< 44 )) {
            oSpP.log('Application can not work with Firefox browser version less then 44');
            return false;
        }
        if ((sBrowser == 'firefox')&&(sOs=='Android')) {
            oSpP.log('Application can not work with Firefox on Android');
            return false;
        }

        if (bSendToParent) {
            if (isParentAutoSubscribe) {
                bSentStatOpened = true;
                bSentStatPermission = true;
            }
            var ti = setInterval(function(){
                if (bSentToServer && bSentStatOpened && bSentStatPermission) {
                    oSpP.sendToParent('closeme');
                    clearInterval(ti);
                }
            },50);
        }

        if (bHttps) {
            if (bAutoSubscribe) {
                oSpP.startSubscription();
                if(sBrowser=='safari' || sBrowser=='chrome' || sBrowser=='firefox') oSpP.showhelpPromptText();
            } else {
                oSpP.getDbValue('SPIDs','PromptClosed',function(data) {
                    if (data.target.result === undefined) {
                        if(sBrowser=='safari' || sBrowser=='chrome' || sBrowser=='firefox') oSpP.showCustomPrompt();
                    }
                });
                var aSubscribeButtons = document.querySelectorAll('.sp_notify_prompt');
                for (var i=0; i<aSubscribeButtons.length; i++){
                    aSubscribeButtons[i].addEventListener('click', function() {
                        // oSpP.showPrompt();
                        oSpP.startSubscription();
                    });
                }
            }
        }
        if (bSendToParent){
            window.addEventListener("message", function(event){
                if (oSpP.detectOrigin(event.origin)) {
                    if (event.data=='init') {
                        parentEvent = event;
                        parentEvent.source.postMessage('initend',parentEvent.origin);
                    } else if (event.data.indexOf('initpage')===0) {
                        var initedData = event.data.split('|');
                        if (initedData.length == 2) {
                            initedPage = initedData[1];
                        }
                    } else if (event.data.indexOf('initvariables')===0) {
                        var initedData = event.data.split('|');
                        parentVariables = JSON.parse(initedData[1]);
                    }
                }
            }, false);
        }
    }

    //******************************************************************************************************************
    this.startSubscription = function(){
        switch (sBrowser) {
            case 'safari':
                if (oSpP.isSafariNotificationSupported()) {
                    var permissionData = window.safari.pushNotification.permission(sSafariPushId);
                    oSpP.checkSafariPermission(permissionData);
                }
                break;
            case 'chrome':
            case 'firefox':
                if (bHttps) {
                    var manifest = document.createElement("link");
                    manifest.rel = "manifest";
                    //manifest.href = sAppUrl + "/manifest.json";
                    manifest.href = "/sp-push-manifest.json";
                    document.head.appendChild(manifest);
                }

                if (oSpP.isServiceWorkerChromeSupported()) {
                    oSpP.log('ASK for Permission');
                    startTime = Date.now();
                    Notification.requestPermission(oSpP.doActionsWithPermissions);
                    oSpP.registerChrome();
                }
                break;
        }
    }

    //******************************************************************************************************************
    this.clearDomain = function(string){
        return string
            .replace('://www.','://')
            .replace('://www2.','://');
    }

    //******************************************************************************************************************
    this.detectSite = function(){
        return (!(oSpP.clearDomain(window.location.href.toLowerCase()).indexOf(oSpP.clearDomain(sAppUrl.toLowerCase())) === -1));
    }

    //******************************************************************************************************************
    this.detectOrigin = function(sTest){
        return (!(oSpP.clearDomain(sTest.toLowerCase()).indexOf(oSpP.clearDomain(sOrigUrl.toLowerCase())) === -1));
    }

    //******************************************************************************************************************
    this.detectHttps = function(){
        bHttps = (window.location.href.indexOf('https://') === 0);
    }

    //******************************************************************************************************************
    this.log = function(sMessage){
        //console.log(sMessage);
    }

    //******************************************************************************************************************
    this.detectBrowser = function() {
        var e, i = navigator.userAgent, t = i.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        var ie = i.match(/(edge(?=\/))\/?\s*(\d+)/i) || [];
        if ('Edge' === ie[1]) {
            return { name: ie[1], version: ie[2] }
        }
        return /trident/i.test(t[1]) ? (e = /\brv[ :]+(\d+)/g.exec(i) || [], {
            name: "IE",
            version: e[1] || ""
        }) : "Chrome" === t[1] && (e = i.match(/\bOPR\/(\d+)/), null != e) ? {
            name: "Opera",
            version: e[1]
        } : (t = t[2] ? [t[1], t[2]] : [navigator.appName, navigator.appVersion, "-?"], null != (e = i.match(/version\/(\d+)/i)) && t.splice(1, 1, e[1]), {
            name: t[0],
            version: t[1]
        })
    };

    //******************************************************************************************************************
    this.isServiceWorkerChromeSupported = function(){
        return "serviceWorker" in navigator;
    }

    //******************************************************************************************************************
    this.isSafariNotificationSupported = function(){
        return "safari" in window && "pushNotification" in window.safari;
    }

    //******************************************************************************************************************
    this.getBrowserlanguage = function() {
        return navigator.language.substring(0, 2)
    }

    //******************************************************************************************************************
    this.setCookie = function(name, value, timeout) {
        var n = new Date;
        n.setTime(n.getTime() + 24 * timeout * 60 * 60 * 1e3);
        var a = "expires=" + n.toUTCString();
        document.cookie = name + "=" + value + "; " + a
    }

    //******************************************************************************************************************
    this.checkCookie = function(name) {
        for (var i = name + "=", t = document.cookie.split(";"), n = 0; n < t.length; n++) {
            for (var a = t[n]; " " == a.charAt(0);)a = a.substring(1);
            if (0 == a.indexOf(i))return a.substring(i.length, a.length)
        }
        return ""
    }

    //******************************************************************************************************************
    this.doActionsWithPermissions = function(permissions){
        var nowStamp = Date.now();
        var timeDiff = nowStamp - startTime;
        if (timeDiff < 50) {
            bWasPrompt = false;
        } else {
            bWasPrompt = true;
        }

        /*
        if (bWasPrompt) {
            oSpP.deleteDbValue("SPIDs",'SubscriptionId');
        }
        */

        // Chrome, closed window: permissions = default, subscription = null
        oSpP.log('[DD] Permissions: '+permissions);
        oSpP.log('[DD] Time diff: '+timeDiff);
        switch (permissions) {
            case 'granted':
                if (! isParentAutoSubscribe){
                    if (bWasPrompt) {
                        oSpP.getDbValue('SPIDs','PromptShowed',function(data) {
                            if (data.target.result === undefined) {
                                oSpP.sendPromptStat('prompt_showed');
                                oSpP.sendPromptStat('prompt_granted');
                                oSpP.putValueToDb("SPIDs", {
                                    type: "PromptShowed",
                                    value: 1
                                });
                            } else {
                                oSpP.sendPromptStat('prompt_showed_again');
                                oSpP.sendPromptStat('prompt_granted');
                            }
                        });
                    }
                }
                switch (sBrowser) {
                    case 'chrome':
                    case 'firefox':
                        oSpP.subscribe();
                        break;
                }
                break;
            case 'default':
                if (! isParentAutoSubscribe){
                    if (bWasPrompt) {
                        oSpP.getDbValue('SPIDs','PromptShowed',function(data) {
                            if (data.target.result === undefined) {
                                oSpP.sendPromptStat('prompt_showed');
                                oSpP.sendPromptStat('prompt_closed');
                                oSpP.putValueToDb("SPIDs", {
                                    type: "PromptShowed",
                                    value: 1
                                });
                            } else {
                                oSpP.sendPromptStat('prompt_showed_again');
                                oSpP.sendPromptStat('prompt_closed');
                            }
                        });
                    }
                }
                break;
            case 'denied':
                if (! isParentAutoSubscribe) {
                    if (bWasPrompt) {
                        oSpP.getDbValue('SPIDs','PromptShowed',function(data) {
                            if (data.target.result === undefined) {
                                oSpP.sendPromptStat('prompt_showed');
                                oSpP.sendPromptStat('prompt_denied');
                                oSpP.putValueToDb("SPIDs", {
                                    type: "PromptShowed",
                                    value: 1
                                });
                            } else {
                                oSpP.sendPromptStat('prompt_showed_again');
                                oSpP.sendPromptStat('prompt_denied');
                            }
                        });
                    }
                }
                break;
        }
        if(!bAutoSubscribe) {
            if (permissions == 'default') {
                oSpP.closeCustomPrompt(false);
            } else {
                oSpP.closeCustomPrompt(true);
            }
        }else{
            if (permissions == 'default') {
                oSpP.closePromptHelpText(false);
            } else {
                oSpP.closePromptHelpText(true);
            }
        }
    }

    //******************************************************************************************************************
    this.registerChrome = function(){
        navigator.serviceWorker.register('/sp-push-worker.js').then(function(reg) {
            if(reg.installing) {
                oSpP.log('Service worker installing');
            } else if(reg.waiting) {
                oSpP.log('Service worker installed');
            } else if(reg.active) {
                oSpP.log('Service worker active');
            }
            //oSpP.initialiseState(reg);
        });
    }

    //******************************************************************************************************************
    this.checkSafariPermission = function (permissionData) {
        oSpP.log('[DD] Permissions: '+permissionData.permission);
        if (permissionData.permission === 'default') {
            if(!bAutoSubscribe) oSpP.closeCustomPrompt(false);
            else oSpP.closePromptHelpText(false);
            bWasPrompt = true;
            oSpP.getDbValue('SPIDs','PromptShowed',function(data) {
                if (data.target.result === undefined) {
                    oSpP.sendPromptStat('prompt_showed');
                    oSpP.putValueToDb("SPIDs", {
                        type: "PromptShowed",
                        value: 1
                    });
                } else {
                    oSpP.sendPromptStat('prompt_showed_again');
                }
            });
            window.safari.pushNotification.requestPermission(
                sServerApi, // должен совпадать с webServiceURL в website.json из PUSH пакета
                sSafariPushId,
                { // любые даныне, которые нам надо передавать
                    appkey: sAppKey
                },
                oSpP.checkSafariPermission // The callback function.
            );
        }
        else if (permissionData.permission === 'denied') {
            if(!bAutoSubscribe) oSpP.closeCustomPrompt(true);
            else oSpP.closePromptHelpText(true);
            if (bWasPrompt) {
                oSpP.sendPromptStat('prompt_denied');
            }
        }
        else if (permissionData.permission === 'granted') {
            if(!bAutoSubscribe) oSpP.closeCustomPrompt(true);
            else oSpP.closePromptHelpText(true);
            if (bWasPrompt) {
                oSpP.sendPromptStat('prompt_granted');
            }
            oSpP.subscribe();
        }
    };

    //******************************************************************************************************************
    this.initialiseState = function(reg) {
        if (!(reg.showNotification)) {
            oSpP.log('Notifications aren\'t supported on service workers.');
        } else {
        }

        if (Notification.permission === 'denied') {
            oSpP.log('The user has blocked notifications.');
            return;
        }
        if (!('PushManager' in window)) {
            oSpP.log('Push messaging isn\'t supported.');
            return;
        }

    }

    //******************************************************************************************************************
    this.endpointWorkaround = function(pushSubscription) {
        // Chrome 42 + 43 will not have the subscriptionId attached to the endpoint.
        switch (sBrowser) {
            case 'chrome':
                if ('subscriptionId' in pushSubscription) {
                    var subscriptionId = pushSubscription.subscriptionId;
                } else {
                    var subscriptionId = pushSubscription.endpoint;
                }
                if (~subscriptionId.indexOf(gcmServer)) {
                    var token = subscriptionId.split(gcmServer);
                    return token[1];
                } else {
                    return subscriptionId;
                }
                break;
            case 'firefox':
                var subscriptionId = pushSubscription.endpoint;
                if (~subscriptionId.indexOf(sFirefoxServer)) {
                    var token = subscriptionId.split(sFirefoxServer);
                    //return token[1].replace('v1/','').replace('v2/','');
                    return token[1];
                } else {
                    return subscriptionId;
                }
        }
    }

    //******************************************************************************************************************
    this.subscribe = function() {
        switch (sBrowser) {
            case 'chrome':
            case 'firefox':
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.pushManager.subscribe({userVisibleOnly: true}).then(function(subscription) {
                        //oSpP.log('[DD] Already subscribed');
                        var subscriptionId = oSpP.endpointWorkaround(subscription);

                        var pubKey = subscription.getKey ? subscription.getKey('p256dh') : '';
                        var sPubKey = pubKey ? btoa(String.fromCharCode.apply(null, new Uint8Array(pubKey))) : '';

                        oSpP.checkLocalSubsctoption(subscriptionId, sPubKey);
                        if (bSendToParent) {
                            oSpP.sendToParent(subscriptionId);
                        }
                    })/*.catch(function(e) {
                     if (Notification.permission === 'denied') {
                     oSpP.log('Permission for Notifications was denied');
                     } else {
                     oSpP.log('Unable to subscribe to push.');
                     oSpP.log(e);
                     }
                     });
                     */
                });
                break;
            case 'safari':
                var permissionData = window.safari.pushNotification.permission(sSafariPushId);
                if (permissionData.permission === 'granted'){
                    var subscriptionId = permissionData.deviceToken;
                    oSpP.checkLocalSubsctoption(subscriptionId);
                    if (bSendToParent) {
                        oSpP.sendToParent(subscriptionId);
                    }
                }
                break;
        }
    }

    //******************************************************************************************************************
    this.checkLocalSubsctoption = function(subscriptionId, sPubKey){
        oSpP.log('[DD] subscribe :: subscriptionId: '+subscriptionId);
        oSpP.getDbValue('SPIDs','SubscriptionId',function(data){
            if (data.target.result === undefined) {
                oSpP.sendSubscribeDataToServer(subscriptionId,'subscribe', undefined,  sPubKey);
                oSpP.putValueToDb("SPIDs", {
                    type: "SubscriptionId",
                    value: subscriptionId
                });
            } else if (data.target.result.value !== subscriptionId) {
                oSpP.sendSubscribeDataToServer(data.target.result.value,'unsubscribe');
                oSpP.sendSubscribeDataToServer(subscriptionId,'subscribe', undefined, sPubKey);
                oSpP.putValueToDb("SPIDs", {
                    type: "SubscriptionId",
                    value: subscriptionId
                });
            }
        });
    }

    //******************************************************************************************************************
    this.unsubscribe = function() {
        switch (sBrowser) {
            case 'chrome':
            case 'firefox':
                navigator.serviceWorker.ready.then(function(reg) {
                    reg.pushManager.getSubscription().then(
                        function(subscription) {
                            var subscriptionId = oSpP.endpointWorkaround(subscription);
                            if (!subscription) {
                                // не подписан
                                return;
                            }
                            subscription.unsubscribe().then(function(successful) {
                                // отписался
                            })/*.catch(function(e) {
                             oSpP.log('Unsubscription error: ', e);
                             });*/
                        })/*.catch(function(e) {
                     oSpP.log('Error thrown while unsubscribing from push messaging.', e);
                     });*/
                });
                break;
            case 'safari':
                var permissionData = window.safari.pushNotification.permission(safariPushId);
                if (permissionData.permission === 'granted'){
                    var subscriptionId = permissionData.deviceToken;
                }
                break;
        }
    }

    //******************************************************************************************************************
    this.getUserVariables = function(){
        var aData = {};
        var dataFields = document.querySelectorAll('input.sp_push_custom_data');

        for (var i=0; i<dataFields.length; i++){
            switch (dataFields[i].type) {
                case 'text':
                case 'hidden':
                    aData[dataFields[i].name] = dataFields[i].value;
                    break;
                case 'checkbox':
                    aData[dataFields[i].name] = (dataFields[i].checked) ? 1 : 0;
                    break;
                case 'radio':
                    if (dataFields[i].checked) {
                        aData[dataFields[i].name] = dataFields[i].value;
                    }
                    break;
            }
        }
        return aData;
    }

    //******************************************************************************************************************
    this.sendSubscribeDataToServer = function(subscriptionId, subscription_action, additional_data, sPubKey){
        var request = new XMLHttpRequest();
        if ((bSendToParent)&&(subscription_action == 'subscribe')) {
            request.onreadystatechange = function() {
                if ((request.readyState == 4) && (request.status == 200)) {
                    // oSpP.sendToParent('closeme');
                    bSentToServer = true;
                }
            }
        }
        request.open('POST', sServerApi, true);
        request.setRequestHeader('Content-Type', 'application/json');
        if (additional_data === undefined){
            additional_data = {};
            additional_data['uname'] = oSpP.checkCookie('lgn');
            additional_data['os'] = oSpP.detectOs();
        }
        if (sPubKey === undefined) {
            sPubKey = '';
        }
        var getIpRequest = new XMLHttpRequest();
        getIpRequest.onreadystatechange = function() {
            if (getIpRequest.readyState == 4) {
                if (getIpRequest.status == 200) {
                    additional_data['ip'] = getIpRequest.responseText.replace("\n",'');
                } else {
                    additional_data['ip'] = '';
                }
                if (bSendToParent) {
                    additional_data['variables'] = parentVariables;
                } else {
                    additional_data['variables'] = oSpP.getUserVariables();
                }
                var oDate = new Date();
                var currentTimeZoneOffsetInHours = -oDate.getTimezoneOffset()/60;
                additional_data['timezoneoffset'] = currentTimeZoneOffsetInHours;

                var sitePage = (initedPage) ? initedPage : window.location.href;
                var subscribeObj = {
                    action: 'subscription',
                    subscriptionId: subscriptionId,
                    subscription_action : subscription_action,
                    appkey: sAppKey,
                    browser: aBrowser,
                    lang: oSpP.getBrowserlanguage(),
                    url: sitePage,
                    sPubKey: sPubKey,
                    custom_data : additional_data
                };
                request.send(JSON.stringify(subscribeObj));
            }
        }
        getIpRequest.open( "GET", sServerApi+'/getip', true );
        getIpRequest.send();
    }

    //******************************************************************************************************************
    this.initDb = function(callback) {
        if (currentDB) {
            return void callback();
        }
        var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        var db = indexedDB.open("sendpulse_push_db", 2);
        db.onsuccess = function (result) {
            currentDB = result.target.result;
            callback();
        };
        db.onupgradeneeded = function (result) {
            var i = result.target.result;
            i.createObjectStore("SPIDs", {keyPath: "type"});
        }
    }

    //******************************************************************************************************************
    this.getDbValue = function(store, field, callback) {
        oSpP.initDb(function () {
            currentDB.transaction([store], "readonly").objectStore(store).get(field).onsuccess = callback
        })
    }

    //******************************************************************************************************************
    this.putValueToDb = function(store, value) {
        oSpP.initDb(function () {
            currentDB.transaction([store], "readwrite").objectStore(store).put(value)
        })
    }

    //******************************************************************************************************************
    this.deleteDbValue = function(store, field) {
        oSpP.initDb(function () {
            currentDB.transaction([store], "readwrite").objectStore(store)["delete"](field)
        })
    }

    //******************************************************************************************************************
    this.uns = function(){
        oSpP.deleteDbValue("SPIDs",'SubscriptionId');
    }

    //******************************************************************************************************************
    this.detectOs = function(){
        var sOs = '';
        if (navigator.userAgent.indexOf ('Windows') != -1) return('Windows');
        if (navigator.userAgent.indexOf ('Android')!= -1) return('Android');
        if (navigator.userAgent.indexOf ('Linux')!= -1) return('Linux');
        if (navigator.userAgent.indexOf ('iPhone')!= -1) return('iOS');
        if (navigator.userAgent.indexOf ('iPad')!= -1) return('iOS');
        if (navigator.userAgent.indexOf ('Mac')!= -1) return('Mac OS');
        if (navigator.userAgent.indexOf ('FreeBSD')!= -1) return('FreeBSD');
        return '';
    }

    //******************************************************************************************************************
    this.sendToParent = function(data) {
        if (parentEvent===null) {
            var t=setInterval(function(){
                if (parentEvent !== null) {
                    parentEvent.source.postMessage(data,parentEvent.origin);
                    clearInterval(t);
                }
            },100);
        } else {
            parentEvent.source.postMessage(data,parentEvent.origin);
        }
    }

    //******************************************************************************************************************
    this.push = function(name, value){
        if (! oSpP.detectSite()) {
            oSpP.log('Application allowed only for '+sAppUrl);
            return false;
        }

        pushedVariables[name]=value;

        oSpP.getDbValue('SPIDs','SubscriptionId',function(data){
            if (data.target.result === undefined) {
                if (! pushedInterval) {
                    pushedInterval = setInterval(function(){
                        oSpP.getDbValue('SPIDs','SubscriptionId',function(data){
                            if (data.target.result !== undefined) {

                                oSpP.sendUpdatesToServer(data.target.result.value);
                                clearInterval(pushedInterval);
                                pushedInterval = false;
                            }
                        });
                    }, 1000);
                }
            } else {
                // subscriptionId = data.target.result.value
                oSpP.sendUpdatesToServer(data.target.result.value);
            }
        });

    }

    //******************************************************************************************************************
    this.sendUpdatesToServer = function(subscriptionId){
        var request = new XMLHttpRequest();
        request.open('POST', sServerApi, true);
        request.setRequestHeader('Content-Type', 'application/json');
        var subscribeObj = {
            action: 'subscription',
            subscriptionId: subscriptionId,
            subscription_action : 'update_variables',
            appkey: sAppKey,
            custom_data : {
                variables: pushedVariables
            }
        };
        request.send(JSON.stringify(subscribeObj));
    }

    //******************************************************************************************************************
    this.sendPromptStat = function(action){
        if ((! bSendToParent)||(! isParentAutoSubscribe)) {
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if ((request.readyState == 4) && (request.status == 200)) {
                    if ((action == 'prompt_showed')||(action == 'prompt_showed_again')) {
                        bSentStatOpened = true;
                    } else if ((action == 'prompt_granted')||(action == 'prompt_closed')||(action == 'prompt_denied')) {
                        bSentStatPermission = true;
                    }
                }
            }
            request.open('POST', sServerApi, true);
            request.setRequestHeader('Content-Type', 'application/json');
            var subscribeObj = {
                action: 'statisctic',
                statisctic_action : action,
                appkey: sAppKey
            };
            request.send(JSON.stringify(subscribeObj));
        }
    }
    this.showhelpPromptText = function (){
        if(prompt_description.length>=0){
            var head = document.getElementsByTagName("head")[0];
            var promptCss = document.createElement("link");
            promptCss.rel = "stylesheet";
            promptCss.type = "text/css";
            promptCss.href = "https://cdn.sendpulse.com/css/push/sendpulse-prompt.min.css"; //"https://cdn.sendpulse.com/css/push/sendpulse-prompt-def4.css"
            promptCss.media = "all";
            head.appendChild(promptCss);
            if(prompt_description=='-') return;
            var backDiv = document.createElement("div");
            backDiv.setAttribute("class", "sendpulse-backdrop-info");
            backDiv.setAttribute("style",'display:none;');
            var closeDiv = document.createElement("div");
            closeDiv.setAttribute("class", "backdrop-close");
            closeDiv.innerHTML += "<big>×</big><br><small>ESC</small>";
            closeDiv.setAttribute("onclick","oSpP.closePromptHelpText(false); return false;");
            backDiv.appendChild(closeDiv);
            var messageDiv = document.createElement("div");
            messageDiv.setAttribute("class", "backdrop-message");
            messageDiv.innerHTML += prompt_description;
            backDiv.appendChild(messageDiv);
            document.body.insertBefore(backDiv, document.body.childNodes[0]);
            setTimeout(function(){
                oSpP.getDbValue('SPIDs','PromptClosed',function(data) {
                    if (data.target.result === undefined) {
                        backDiv.className += backDiv.className ? ' show-prompt' : 'show-prompt';
                    }
                });
            },1000);
        }
    }
    this.showCustomPrompt = function(){
        oSpP.getDbValue('SPIDs','PromptShowed',function(data) {
            if (data.target.result === undefined) {
                oSpP.sendPromptStat('prompt_showed');
                oSpP.putValueToDb("SPIDs", {
                    type: "PromptShowed",
                    value: 1
                });
            } else {
                oSpP.sendPromptStat('prompt_showed_again');
            }
        });

        var head = document.getElementsByTagName("head")[0];
        var promptCss = document.createElement("link");
        promptCss.rel = "stylesheet";
        promptCss.type = "text/css";
        promptCss.href = "https://cdn.sendpulse.com/css/push/sendpulse-prompt.min.css"; //"https://cdn.sendpulse.com/css/push/sendpulse-prompt-def4.css"
        promptCss.media = "all";
        head.appendChild(promptCss);
        var psettings;
        var main_style = 'sendpulse-popover';
        var prompt_style = 'display:none;';
        var showsplogo = true;
        if( typeof show_splogo != 'undefined'){
            if(show_splogo==0)
                showsplogo = false;
        }
        var sLang = oSpP.getMessageLang(oSpP.getBrowserlanguage());
        if(prompt_settings.length>0){
            var poweredbysepico = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAPCAMAAAAMCGV4AAAAk1BMVEUNkaAmtrIltLEMj58Mj58mtrIks7EfrK0MkKD///8Pk6EmtrIisK8cp6oTmaQRlqIZoqkVnKaz4OL7/v7t+PhjvsT4/P3l9vbY8PDM6uy74+Ww3uGc2dt3ysx1xMoyrLLx+fro9vat4+Kj2t2NztOB0dF/yc5myMhevsNMwL8/u7pMsLlDr7cyuLY9sbY7p7IkpazkILODAAAABnRSTlPn5ubmSkmZnvKZAAAAiElEQVQI10XHVRbCQBBE0SJGeoCxuONu+18dpDPn5P7UK4SL1WwRwovYnl7jeIgmBd14sWZ3ogsHlqwjOnG4b8uknf6G7dqi5oAevelalXo4ZBqaiIYu+Vr622oYY9K+qcwzy865NZBS2iY9ypGREkqpPqGHciCE+FAuhQPEsUjr2AECP575wQ+doQxkp1hUBQAAAABJRU5ErkJggg==">';
            var svg_icon_bell = '<svg style="display: none;"><symbol id="sp_bell_icon"><path d="M139.165 51.42L103.39 15.558C43.412 61.202 3.74 132.185 0 212.402h50.174c3.742-66.41 37.877-124.636 88.99-160.98zM474.98 212.403h50.173c-3.742-80.217-43.413-151.2-103.586-196.845L385.704 51.42c51.398 36.346 85.533 94.572 89.275 160.982zm-49.388 12.582c0-77-53.39-141.463-125.424-158.487v-17.09c0-20.786-16.76-37.613-37.592-37.613s-37.592 16.827-37.592 37.614v17.09C152.95 83.52 99.56 148.004 99.56 224.983v137.918L49.408 413.01v25.076h426.336V413.01l-50.152-50.108V224.984zM262.576 513.358c3.523 0 6.76-.22 10.065-1.007 16.237-3.237 29.825-14.528 36.06-29.626 2.517-5.952 4.05-12.494 4.05-19.54H212.4c0 27.593 22.582 50.174 50.174 50.174z" /></symbol></svg>';
            psettings = JSON.parse(prompt_settings);
            main_style = psettings.style;
            var promptDiv = document.createElement("div");
            promptDiv.setAttribute("class", "sendpulse-prompt" + " " + main_style);
            if(psettings.backgroundcolor.length>0) prompt_style = prompt_style+"background-color: "+psettings.backgroundcolor+";";
            promptDiv.setAttribute("style",prompt_style);
            var innerDiv = document.createElement("div");
            innerDiv.setAttribute("class","sendpulse-prompt-message");
            var icon = document.createElement("img");
            icon.setAttribute('class','sendpulse-bell-icon');
            icon.setAttribute('width','14');
            icon.setAttribute('height','14');
            icon.setAttribute('src','https://cdn.sendpulse.com/img/push/icon-ring.svg');
            if(showsplogo) {
                var poweredspan = document.createElement("span");
                poweredspan.setAttribute('class','sp-link-wrapper');
                var apoweredspan = document.createElement("a");
                apoweredspan.setAttribute('class','sp-link');
                apoweredspan.setAttribute('href','https://'+spdomain_website+'/webpush');
                apoweredspan.setAttribute('target','_blank');
                var spanpoweredtext =  document.createElement("span");
                spanpoweredtext.innerHTML = aPoweredbySendpulse[sLang];
                if(main_style!='sendpulse-bar') apoweredspan.innerHTML = poweredbysepico;
                apoweredspan.appendChild(spanpoweredtext);
                poweredspan.appendChild(apoweredspan);
            }
            if(main_style=='sendpulse-bar'){
                var message1Div = document.createElement("div");
                message1Div.setAttribute("class","sendpulse-prompt-info sendpulse-prompt-message-text");
                message1Div.setAttribute("style","color: "+psettings.textcolor+" !important;");
                message1Div.innerHTML+=prompt_text;
                var message2Div = document.createElement("span");
                innerDiv.innerHTML+= svg_icon_bell+'<svg viewBox="0 0 525.153 525.153" width="40" height="40" xmlns:xlink="http://www.w3.org/1999/xlink" class="sendpulse-bell-icon"><use class="sendpulse-bell-path" style="fill: '+psettings.textcolor+' !important;" xlink:href="#sp_bell_icon" x="0" y="0" />  </svg>';
            }else if(main_style=='sendpulse-fab'){
                var message1Div = document.createElement("div");
                message1Div.setAttribute("class", "sendpulse-prompt-title sendpulse-prompt-message-text");
                if(psettings.textcolor.length>0) message1Div.setAttribute("style","color: "+psettings.textcolor+" !important;");
                message1Div.innerHTML = prompt_title;
                var message2Div = document.createElement("div");
                message2Div.setAttribute("class","sendpulse-prompt-info sendpulse-prompt-message-text");
                if(psettings.textcolor.length>0) message2Div.setAttribute("style","color: "+psettings.textcolor+" !important;");
                message2Div.innerHTML+= prompt_text;
                var fabDiv = document.createElement("div");
                fabDiv.setAttribute("class", "sendpulse-prompt-fab sp_notify_prompt");
                fabDiv.setAttribute("onclick", "oSpP.startSubscription(); return false;");
                if(psettings.btncolor.length>0) fabDiv.setAttribute("style","background-color: "+psettings.btncolor+" !important;");
                fabDiv.innerHTML +=svg_icon_bell+'<svg viewBox="0 0 525.153 525.153" width="40" height="40" xmlns:xlink="http://www.w3.org/1999/xlink" class="sendpulse-bell-icon" ><use class="sendpulse-bell-path bell-prompt-fab" style="fill: ' + psettings.iconcolor + ' !important;" xlink:href="#sp_bell_icon" x="0" y="0" /></svg>';
            }
            if(main_style=='sendpulse-bar') {
                var buttonDiv = document.createElement("div");
                buttonDiv.setAttribute("class", "sendpulse-prompt-buttons");
                var buttonAllow = document.createElement("button");
                buttonAllow.setAttribute('class', 'sendpulse-prompt-btn sendpulse-accept-btn sp_notify_prompt');
                buttonAllow.setAttribute('type', 'button');
                buttonAllow.setAttribute("onclick", "oSpP.startSubscription(); return false;");
                var buttonDeny = document.createElement("button");
                buttonDeny.setAttribute('class', 'sendpulse-prompt-btn sendpulse-disallow-btn');
                buttonDeny.setAttribute('type', 'button');
                buttonDeny.setAttribute("onclick", "oSpP.sendPromptStat('prompt_denied');oSpP.closeCustomPrompt(true); return false;");
                buttonAllow.innerHTML = psettings.allowbtntext;
                buttonDeny.innerHTML = psettings.disallowbtntext;
                buttonAllow.setAttribute("style", "background-color:" + psettings.buttoncolor + " !important;border-color:" + psettings.buttoncolor + " !important;");
                buttonDeny.setAttribute("style", "color:" + psettings.buttoncolor + " !important;");
                buttonDiv.appendChild(buttonDeny);
                buttonDiv.appendChild(buttonAllow);
            }
            innerDiv.appendChild(message1Div);
            innerDiv.appendChild(message2Div);
            if(main_style!='sendpulse-fab') {
                innerDiv.appendChild(buttonDiv);
                if(showsplogo && typeof poweredspan != 'undefined')
                    promptDiv.appendChild(poweredspan);
                promptDiv.appendChild(innerDiv);
            }else{
                if(showsplogo && typeof poweredspan != 'undefined')
                    innerDiv.appendChild(poweredspan);
                promptDiv.appendChild(innerDiv);
                promptDiv.appendChild(fabDiv);
            }
            if(main_style=='sendpulse-bar') {
                var closeButton = document.createElement("button");
                closeButton.setAttribute('class','sendpulse-prompt-close');
                closeButton.setAttribute("onclick","oSpP.closeCustomPrompt(false); return false;");
                closeButton.setAttribute("style", "color:" + psettings.textcolor + " !important;");
                closeButton.innerHTML='&times;';
                promptDiv.appendChild(closeButton);
            }
            document.body.insertBefore(promptDiv, document.body.childNodes[0]);
            setTimeout(function(){
                promptDiv.className += promptDiv.className ? ' show-prompt' : 'show-prompt';
            },1000);
        }
        /*else {
             var promptDiv = document.createElement("div");
             promptDiv.setAttribute("class", "sendpulse-prompt" + " " + main_style);
             promptDiv.setAttribute("style",prompt_style);
             var innerDiv = document.createElement("div");
             innerDiv.setAttribute("class", "sendpulse-prompt-message");
             var message1Div = document.createElement("div");
             message1Div.setAttribute("class", "sendpulse-prompt-message-text");
             message1Div.innerHTML = sAppUrlShow + ' ' + aPromptMessage1[sLang];
             var message2Div = document.createElement("div");
             message2Div.setAttribute("class", "sendpulse-prompt-info sendpulse-prompt-message-text");
             var icon = document.createElement("img");
             icon.setAttribute('class', 'sendpulse-bell-icon');
             icon.setAttribute('width', '14');
             icon.setAttribute('height', '14');
             icon.setAttribute('src', 'https://cdn.sendpulse.com/img/push/icon-ring.svg');
             message2Div.appendChild(icon);
             message2Div.innerHTML += ' ' + aPromptMessage2[sLang];
         }*/
    }

    //******************************************************************************************************************
    this.closeCustomPrompt = function(saveclosed){
        oSpP.sendPromptStat('prompt_closed');
        if(document.querySelector('.sendpulse-prompt') !== null) {
            document.body.removeChild(document.querySelector('.sendpulse-prompt'));
        }
        if (saveclosed) {
            oSpP.putValueToDb("SPIDs", {
                type: "PromptClosed",
                value: 1
            });
        }
    }

    this.closePromptHelpText = function(saveclosed){
        if(document.querySelector('.sendpulse-backdrop-info') !== null) {
            document.body.removeChild(document.querySelector('.sendpulse-backdrop-info'));
        }
        var n = new Notification("123");
        n.close.bind(n);
        if (saveclosed) {
            oSpP.sendPromptStat('prompt_closed');
            oSpP.putValueToDb("SPIDs", {
                type: "PromptClosed",
                value: 1
            });
        }
    }
    //******************************************************************************************************************
    this.getMessageLang = function(ulang) {
        ulang = ulang.substring(0, 2).toLowerCase();
        if (ulang == 'ua' || ulang == 'uk') {
            return 'ua';
        } else if (ulang == 'ru') {
            return 'ru';
        } else {
            return 'en';
        }
    }
    //******************************************************************************************************************
    /*
     this.getUnixTimeStamp = function(){
     return Math.floor(Date.now() / 1000);
     }
     */

}

//**********************************************************************************************************************
window.addEventListener('load', function() {
    oSpP.start();
});
var oSpP = new oSendpulsePush();
document.onkeyup = function (e) {
     e = e || window.event;
     if (e.keyCode === 27) oSpP.closePromptHelpText(false);
}
