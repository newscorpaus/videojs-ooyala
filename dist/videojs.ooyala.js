/*! videojs-ooyala - v0.1.0 - 2015-10-14 */
!function(a){var b={mp4:"video/mp4",flv:"video/flv",hls:"application/x-mpegURL"},c={EXPIRED:5,GEO_BLOCKED:3},d={sasUrl:"//player.ooyala.com/sas/player_api/v1/authorization/embed_code/",metaDataUrl:"//player.ooyala.com/player_api/v1/metadata/embed_code/",errors:{MEDIA_ERR_OOYALA_EXPIRED:{code:"MEDIA_ERR_OOYALA_EXPIRED",headline:"Sorry, this video is no longer available",message:""},MEDIA_ERR_OOYALA_BLOCKED:{code:"MEDIA_ERR_OOYALA_BLOCKED",headline:"Sorry, this video is not available in your region",message:""},MEDIA_ERR_OOYALA:{code:"MEDIA_ERR_OOYALA",headline:"Sorry, this video is no longer available",message:""},MEDIA_ERR_NO_FLASH:{code:"MEDIA_ERR_NO_FLASH",headline:"This content requires the Adobe Flash plugin",message:'To play this content please download it at <a target="_blank" href="https://get.adobe.com/flashplayer/">https://get.adobe.com/flashplayer/</a>'}},enableHls:!1},e=function(a,b){var c=Object.keys(b).map(function(a){return a+"="+b[a]}).join("&");return a+"?"+c},f=function(a){return/mp4/i.test(a)},g=function(a){return/\.flv$/i.test(a)},h=function(a){return/\.m3u8$/i.test(a)},i=function(){return a.Hls&&a.Hls.supportsNativeHls},j=function(a,b){return f(a)&&h(b)?!0:!1},k=function(a,b){var c=[];return(a.hls||i()||b.enableHls)&&c.push("m3u8"),c.push("mp4"),c},l=function(b){return b.mobileProfile&&(a.IS_IOS||a.IS_ANDROID)?b.mobileProfile:null},m=function(a,b){var d,e=parseInt(a,10);switch(e){case c.EXPIRED:d=b.errors.MEDIA_ERR_OOYALA_EXPIRED;break;case c.GEO_BLOCKED:d=b.errors.MEDIA_ERR_OOYALA_BLOCKED;break;default:d=b.errors.MEDIA_ERR_OOYALA,d.code=d.code+"_"+a}return d},n=function(a,b,c){var d={device:"generic",domain:window.location.hostname,supportedFormats:k(a,b),_:(new Date).getTime()},f=l(b);f&&(d.profiles=f);var g=b.sasUrl+b.pcode+"/"+c,h=e(g,d);return h},o=function(c){var d=[];return Object.keys(c).map(function(e){var i=c[e];if(!i.authorized)return void(d[e]={authorized:!1,message:i.message,code:i.code});var j,k,l=i.streams[0],m=l.delivery_type;j=window.atob(l.url.data),j=j.replace(/^(http:|https:)/,""),j=window.location.protocol+j,k=b.mp4,f(m)?(k=b.mp4,j=j.replace("https","http")):g(j)?k=b.flv:h(j)&&(k=b.hls),d[e]=a.util.mergeOptions(l,{authorized:i.authorized,type:k,src:j})}),d},p=function(b){var c=a.util.mergeOptions(d,b),f=this;return c.pcode?c.playerBrandingId?(f.ooyala.getVideoSource=function(b,d){if(!b)return d&&d("Missing embedCodes to load through Ooyala Plugin",null),!1;var e=n(f,c,b);a.xhr(e,function(a,b,c){var e=JSON.parse(c),f=e.authorization_data,g=o(f);if(d){var h={apiResponse:e,videoUrls:g};d(null,h)}})},f.ooyala.getMetadata=function(b,d){if(!b)return d&&d("Missing embedCodes to load through Ooyala Plugin",null),!1;var f=c.metaDataUrl+c.playerBrandingId+"/"+b;f=e(f,{videoPcode:c.pcode}),a.xhr(f,function(a,b,c){var e,f=JSON.parse(c);if(f&&f.errors&&f.errors.code)return d&&d(f.errors.message,null),!1;var e=f&&f.metadata&&f.metadata,g={};Object.keys(e).map(function(a){g[a]=e[a].base}),d&&d(null,g)})},f.ooyala.prepareSettingSource=function(a,b,d){if(b&&b.videoUrls&&b.videoUrls[a]){var e=b.videoUrls[a];if("undefined"==typeof e.authorized||e.authorized)if(j(e.type,e.src)){var g=c.errors.MEDIA_ERR_NO_FLASH;d(g,b)}else f.error(null),d(null,b);else{var g=m(e.code,c);d(g,b)}}},void(f.ooyala.setSource=function(a,b){return a?void f.ooyala.getVideoSource(a,function(c,d){f.ooyala.prepareSettingSource(a,d,function(a,c){c&&f.src({type:c.type,src:c.src}),b&&b(a,d)})}):(b&&b("Missing embedCode to set source",null),!1)})):a.log.error("Missing Ooyala playerBrandingId"):a.log.error("Missing Ooyala provider code")};a.plugin("ooyala",p)}(window.videojs);