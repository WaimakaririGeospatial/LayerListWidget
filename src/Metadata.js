define(
[
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/on",
    "dojo/_base/lang",
    "dijit/Dialog",
    "dijit/form/Button",
    "esri/request",
    "dijit/layout/ContentPane",
    "./NlsStrings",
    "jimu/dijit/Message",
     "jimu/dijit/Popup"
   
], function (
  declare,
  array,
  lang,
  dom,
  domConstruct,
  domStyle,
  domAttr,
  on,
  lang,
  Dialog,
  Button,
  esriRequest,
  ContentPane,
  NlsStrings,
  Message,
  Popup
) {
    var Metadata = declare("Metadata", null, {
        config: null,

        constructor: function (config) {
            
            this.nls = NlsStrings.value;
            this.config = config;
          
        },
        _popupTitle:"Metadata",
        _init: function (node, layerInfo) {
            var triggerNode = domConstruct.create('div', {
                'class': "layers-list-metaData-div",
                title: 'Metadata',
                style: "cursor: pointer;"
            }, node);
            if (!layerInfo.layerObject.url) {
                domStyle.set(triggerNode, { "opacity": 0.5 });
                domAttr.set(triggerNode, "title", "Metadata disabled");
                on(triggerNode, "click", lang.hitch(this, function () {
                    var popup = new Message({
                        message: me.nls.metadataWarning,
                        buttons: [{
                            label: me.nls.ok,
                            onClick: lang.hitch(this, function () {
                                popup.close();
                            })
                        }]
                    });
                }));
                
            } else {
                on(triggerNode, "click", lang.hitch(this, function () {
                    this._setPopupTitle(layerInfo.title);
                    this._handleMetadataClick(layerInfo.layerObject.url)
                }));
            }
        },
        _setPopupTitle:function(title){
            this._popupTitle = title;
        },
        _handleMetadataClick: function (url,title) {
            var itemUrl = url.replace("/FeatureServer/", "/MapServer/");
            var layerId = itemUrl.substr(itemUrl.lastIndexOf('/') + 1);
            var serviceUrl = itemUrl.replace(itemUrl.substr(itemUrl.lastIndexOf('/')), '');
            
            var url = serviceUrl + this.config.path;

            url = url.replace(/\{([a-zA-Z]+)\}/g, function (match) {
                return layerId;
            });

            esriRequest({
                url: url,
                callbackParamName: "callback",
                handleAs: "json",
            }).then(lang.hitch(this,function (response) {
                this.parseMetadata(response.metadata);
            }),lang.hitch(this, function (error) {
                var popup = new Message({
                    message: this.nls.metadataWarning,
                    buttons: [{
                        label: this.nls.ok,
                        onClick: lang.hitch(this, function () {
                            popup.close();
                        })
                    }]
                });
            }));
        },
        parseMetadata: function (metadata) {
            var me = this;
            var metadataContent = [];
            var componentConfig = this.config.metadataParseConfig;
            var messageContent = domConstruct.create("div", {
                style: "position:relative;margin:0 auto;width:100%;"
            });
            array.forEach(componentConfig, lang.hitch(this, function (config, index) {
                var label = config.label;
                var info =   this.findDataInPath(config.path, metadata);
                if(info != null){
                    if (label.length > 0) {
                        var labelNode = domConstruct.create("div", {
                            style: "position:relative;float:left;width:100%;margin-top:10px;",
                            innerHTML: label
                        });
                        domConstruct.place(labelNode, messageContent);
                    }
                    var infoNode = domConstruct.create("div", {
                        style: "position:relative;float:left",
                        innerHTML: info
                    });
                    if (label.length > 0) {
                        domStyle.set(infoNode, { "marginLeft": "10px" ,"marginTop":"20px;"})
                    }

                    domConstruct.place(infoNode, messageContent);
                }
            }));
            var popup = new Popup({
                content: messageContent,
                titleLabel: this._popupTitle,
                autoHeight: true,
                maxWidth:400,
                buttons: [{
                    label: this.nls.ok,
                    onClick: lang.hitch(this, function () {
                        popup.close();
                    })
                }]
            });
        },
        findDataInPath:function(path,metadata){
            var subPaths = path.split("->");
            var data = null;
            array.some(subPaths, function (key) {
                if (!metadata[key]) {
                    data = null;
                    return false;
                } else {
                    metadata = metadata[key];
                    data = metadata;
                }
            });
            return data ? this.stripHtml(data) : data;
        },
        stripHtml: function (str) {
            var regex = /(<([^>]+)>)/ig;
            return str.replace(regex, "");
        }
    });
    return Metadata;
});

