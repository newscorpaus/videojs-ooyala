(function(videojs) {
    // Mapping between Ooyala's delivery type to video source type
    var deliveryTypeToSourceType = {
        mp4: 'video/mp4',
        flv: 'video/flv',
        hls: 'application/x-mpegURL'
    },

    // List of authorisation (error) codes from Ooyala API
    // These are the only ones we need to cater for, we can add the rest in later
    // if we want a unique error message for them
    AUTHORIZATION_CODES = {
        EXPIRED: 5,
        GEO_BLOCKED: 3
    },

    defaults = {
        sasUrl: '//player.ooyala.com/sas/player_api/v1/authorization/embed_code/',
        metaDataUrl: '//player.ooyala.com/player_api/v1/metadata/embed_code/',
        // Custom error messages based on failed authorisations from Ooyala API
        errors: {
            MEDIA_ERR_OOYALA_EXPIRED: {
                code:       'MEDIA_ERR_OOYALA_EXPIRED',
                headline:   'Sorry, this video is no longer available',
                message:    ''
            },
            MEDIA_ERR_OOYALA_BLOCKED: {
                code:       'MEDIA_ERR_OOYALA_BLOCKED',
                headline:   'Sorry, this video is not available in your region',
                message:    ''
            },
            MEDIA_ERR_OOYALA: {
                code:       'MEDIA_ERR_OOYALA',
                headline:   'Sorry, this video is no longer available',
                message:    ''
            },
            MEDIA_ERR_NO_FLASH: {
                code:       'MEDIA_ERR_NO_FLASH',
                headline:   'This content requires the Adobe Flash plugin',
                message:    'To play this content please download it at ' +
                            '<a target="_blank" href="https://get.adobe.com/flashplayer/">' +
                            'https://get.adobe.com/flashplayer/</a>'
            }
        },
        enableHls: false
    },

    setUrlParams = function(url, paramsObj) {
        var paramsStr = Object.keys(paramsObj).map(function(key) {
            return key + '=' + paramsObj[key];
        }).join('&');

        return url + '?' + paramsStr;
    },

    isMp4 = function(type) {
        return /mp4/i.test(type);
    },

    isFlv = function(type) {
        return (/\.flv$/i).test(type);
    },

    isHls = function(type) {
        return (/\.m3u8$/i).test(type);
    },

    isHlsNativeSupported = function() {
        return videojs.Hls && videojs.Hls.supportsNativeHls;
    },

    // This scenario happens when the video type doesnt match the source url
    // It occurs when a HLS video is returned from Ooyala but we only asked
    // for an MP4 (because this is only a HLS video)
    isIncorrectMediaType = function(type, src) {
        if (isMp4(type) && isHls(src)) {
            return true;
        }
        return false;
    },

    // Return string with supported video formats based on OS/Browser
    getSupportedFormats = function(player, settings) {

        var formats = [];

        // If the HLS plugin is activated or the device natively supports HLS, we request
        // an m3u8 format video from the Ooyala.
        if (player.hls || isHlsNativeSupported() || settings.enableHls) {
            formats.push('m3u8');
        }

        // always ask for MP4.
        formats.push('mp4');

        return formats;
    },

    // If a mobileProfile is set and we are a mobile device
    // We let SAS authorisation know what profile to narrow our streams to
    supportedVideoProfiles = function(settings) {
        if (settings.mobileProfile && (videojs.IS_IOS || videojs.IS_ANDROID)) {
            return settings.mobileProfile;
        }
        return null;
    },

    // Custom error messages for the video.js player
    getErrorMessage = function(errorCode, settings) {
        var errorCodeInt = parseInt(errorCode, 10),
            errorMessage;

        switch (errorCodeInt) {
            // expired video
            case AUTHORIZATION_CODES.EXPIRED:
                errorMessage = settings.errors.MEDIA_ERR_OOYALA_EXPIRED;
            break;
            // geo-blocked
            case AUTHORIZATION_CODES.GEO_BLOCKED:
                errorMessage = settings.errors.MEDIA_ERR_OOYALA_BLOCKED;
            break;
            // default is expired message
            // and append ooyala error code to the error code
            default:
                errorMessage = settings.errors.MEDIA_ERR_OOYALA;
                errorMessage.code = errorMessage.code + '_' + errorCode;
            break;
        }

        return errorMessage;
    },

    // Generate the correct url for the API call
    ooyalaApiUrl = function(player, settings, embedCodes) {
        var urlParams = {
            'device': 'generic',
            'domain': window.location.hostname,
            'supportedFormats': getSupportedFormats(player, settings),
            // cache buster
            '_' : (new Date()).getTime()
        },
        profiles = supportedVideoProfiles(settings);

        if (profiles) {
            urlParams.profiles = profiles;
        }

        var apiUrl = settings.sasUrl + settings.pcode + '/' + embedCodes,
        apiUrlWithParams = setUrlParams(apiUrl, urlParams);

        return apiUrlWithParams;
    },

    getVideoUrlsFromAuthorizationData = function(authorizationData) {
        var videoUrls = [];

        Object.keys(authorizationData).map(function(key) {

            var thisVideoData = authorizationData[key];

            if (!thisVideoData.authorized) {
                videoUrls[key] = {
                    authorized: false,
                    message: thisVideoData.message,
                    code: thisVideoData.code
                };
                return;
            }

            var videoStream = thisVideoData.streams[0],
                // jscs:disable
                videoDeliveryType = videoStream.delivery_type,
                // jscs:enable
                videoSrc,
                videoType;

            // Video Source Url is Base64 encoded
            // (IE9 and lower need a polyfill for window.atob)
            videoSrc = window.atob(videoStream.url.data);

            // Allow HTTPS served content by setting the correct protocol
            videoSrc = videoSrc.replace(/^(http:|https:)/, '');
            videoSrc = window.location.protocol + videoSrc;

            // Default video type is MP4
            videoType = deliveryTypeToSourceType.mp4;

            //
            // If we get an MP4, we can continue as is.
            // Needs to be checked here before we check for IE9
            //
            if (isMp4(videoDeliveryType)) {
                videoType = deliveryTypeToSourceType.mp4;
                // Force HTTP for MP4
                videoSrc = videoSrc.replace('https', 'http');
            //
            //  If we are playing an old school FLV video
            //
            } else if (isFlv(videoSrc)) {
                videoType = deliveryTypeToSourceType.flv;
            //
            //  .m3u8 content needs to be HLS
            //
            } else if (isHls(videoSrc)) {
                videoType = deliveryTypeToSourceType.hls;
            }

            //
            //  Store this information for callback
            //
            videoUrls[key] = videojs.util.mergeOptions(videoStream, {
                authorized: thisVideoData.authorized,
                type: videoType,
                src: videoSrc
            });

        });

        return videoUrls;
    },

    ooyala = function(options) {

        var settings = videojs.util.mergeOptions(defaults, options),
            player = this;

        if (!settings.pcode) {
            return videojs.log.error('Missing Ooyala provider code');
        }

        if (!settings.playerBrandingId) {
            return videojs.log.error('Missing Ooyala playerBrandingId');
        }

        /**
         * Construct the url required and then fetch the video source from Ooyala
         *
         * @param {string} embedCodes - The Ooyala video EmbedCodes. Can be multiple videos.
         * @param {function(err, res)} callback - Callback function once data is fetched.
         */
        player.ooyala.getVideoSource = function(embedCodes, callback) {

            if (!embedCodes) {
                if (callback) {
                    callback('Missing embedCodes to load through Ooyala Plugin', null);
                }
                return false;
            }

            var url = ooyalaApiUrl(player, settings, embedCodes);

            // Call ooyala's API to get the url of the video source
            videojs.xhr(url, function(error, response, responseBody) {

                var jsonResponse = JSON.parse(responseBody),
                    // jscs:disable
                    authorizationData = jsonResponse.authorization_data,
                    // jscs:enable
                    videoUrls = getVideoUrlsFromAuthorizationData(authorizationData);

                if (callback) {
                    var result = {
                        apiResponse: jsonResponse,
                        videoUrls: videoUrls
                    };
                    callback(null, result);
                }

            });
        };

        /**
         * Retrieve video metadata from Ooyala. This required calling another API endpoint
         *
         * @param {string} embedCodes - The Ooyala video EmbedCodes. Can be multiple videos.
         * @param {function(err, res)} callback - Callback function once data is fetched.
         */
        player.ooyala.getMetadata = function(embedCodes, callback) {

            if (!embedCodes) {
                if (callback) {
                    callback('Missing embedCodes to load through Ooyala Plugin', null);
                }
                return false;
            }

            // Generate the URL
            var metaDataUrl = settings.metaDataUrl + settings.playerBrandingId + '/' + embedCodes;

            metaDataUrl =   setUrlParams(metaDataUrl, {
                                videoPcode: settings.pcode
                            });

            // Make XHR call
            videojs.xhr(metaDataUrl, function(error, response, responseBody) {

                var jsonResponse = JSON.parse(responseBody),
                    metadata;

                // return any ooyala error messages
                if (jsonResponse && jsonResponse.errors && jsonResponse.errors.code) {
                    if (callback) {
                        callback(jsonResponse.errors.message, null);
                    }
                    return false;
                }

                // check if metadata exists
                var metadata = jsonResponse && jsonResponse.metadata && jsonResponse.metadata,
                    videoMetadataCollection = {};

                Object.keys(metadata).map(function(key) {
                    videoMetadataCollection[key] = metadata[key].base;
                });

                if (callback) {
                    callback(null, videoMetadataCollection);
                }

            });
        };

        /**
         * Retrieve video source but return to callback after verifying that we are
         * are authorised to use the video source
         * Public function so you can use it with getVideoSource and then decide what you
         * want to do with the video URLs
         */
        player.ooyala.prepareSettingSource = function(embedCode, res, callback) {

            if (res && res.videoUrls && res.videoUrls[embedCode]) {

                var videoUrls = res.videoUrls[embedCode];

                // An authorisation error was returned from Ooyala
                if (typeof videoUrls.authorized !== 'undefined' && !videoUrls.authorized) {

                    var errorMessage = getErrorMessage(videoUrls.code, settings);
                    callback(errorMessage, res);

                // User can't play HLS on non-flash & non-hls-native devices
                } else if (isIncorrectMediaType(videoUrls.type, videoUrls.src)) {

                    var errorMessage = settings.errors.MEDIA_ERR_NO_FLASH;
                    callback(errorMessage, res);

                } else {

                    player.error(null);
                    callback(null, res);

                }
            }

        };

        /**
         * Retrieve video source and set straight to video player
         *
         * @param {string} embedCode - The Ooyala video EmbedCode.
         * @param {function(err, res)} callback - Returns the results of getVideoSource()
         */
        player.ooyala.setSource = function(embedCode, callback) {

            if (!embedCode) {
                if (callback) {
                    callback('Missing embedCode to set source', null);
                }
                return false;
            }

            player.ooyala.getVideoSource(embedCode, function(getVideoSourceError, getVideoSourceResult) {
                player.ooyala.prepareSettingSource(embedCode, getVideoSourceResult, function(callbackErr, callbackRes) {
                    if (callbackRes) {
                        player.src({
                            type: callbackRes.type,
                            src: callbackRes.src
                        });
                    }

                    if (callback) {
                        callback(callbackErr, getVideoSourceResult);
                    }
                });
            });



        };
    };

    videojs.plugin('ooyala', ooyala);

}(window.videojs));