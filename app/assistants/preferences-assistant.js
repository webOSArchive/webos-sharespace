function PreferencesAssistant() {}

PreferencesAssistant.prototype.setup = function() {

    // --- Server Settings ---

    this.controller.setupWidget("txtEndpointURL",
        this.attributes = {
            hintText: $L("http://raspberrypi.local:8080/"),
            multiline: false,
            enterSubmits: false,
            autoReplace: false,
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: appModel.AppSettingsCurrent["EndpointURL"],
            disabled: false
        }
    );
    this.controller.setupWidget("txtShortURL",
        this.attributes = {
            hintText: $L("http://short.link/  (optional)"),
            multiline: false,
            enterSubmits: false,
            autoReplace: false,
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: appModel.AppSettingsCurrent["ShortURL"],
            disabled: false
        }
    );
    this.controller.setupWidget("txtCustomClientId",
        this.attributes = {
            hintText: $L("Your Server Client ID"),
            multiline: false,
            enterSubmits: false,
            autoReplace: false,
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: appModel.AppSettingsCurrent["CustomClientId"],
            disabled: false
        }
    );
    this.controller.setupWidget("txtCustomCreateKey",
        this.attributes = {
            hintText: $L("Your Server Create Key"),
            multiline: false,
            enterSubmits: false,
            autoReplace: false,
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.model = {
            value: appModel.AppSettingsCurrent["CustomCreateKey"],
            disabled: false
        }
    );
    this.controller.setupWidget("toggleForceHTTPS",
        this.attributes = { trueValue: true, falseValue: false },
        this.model = {
            value: appModel.AppSettingsCurrent["ForceHTTPS"],
            disabled: false
        }
    );
    this.controller.setupWidget("btnTestConnection",
        { type: Mojo.Widget.defaultButton },
        { label: "Test Connection", disabled: false }
    );

    // Endpoint status description
    this.updateEndpointStatus();

    // --- Basic Settings ---

    this.controller.setupWidget("listThemePreference",
        { label: $L({value:"Theme", key:"theme"}),
          labelPlacement: Mojo.Widget.labelPlacementLeft,
          choices: [
              {label: $L({value:"Light", key:"themeLight"}), value: "palm-default"},
              {label: $L({value:"Dark", key:"themeDark"}), value: "palm-dark"},
              {label: $L({value:"System Pref", key:"themeSystem"}), value: "system-theme"}
          ]},
        { value: appModel.AppSettingsCurrent["ThemePreference"] }
    );
    this.controller.setupWidget("listRefresh",
        this.attributes = {
            label: $L("Refresh"),
            choices: [
                { label: "Manual", value: "" },
                { label: "1 minute", value: 60000 },
                { label: "2 minutes", value: 120000 },
                { label: "3 minutes", value: 180000 },
                { label: "5 minutes", value: 300000 }
            ]
        },
        this.model = { value: appModel.AppSettingsCurrent["RefreshTimeout"], disabled: false }
    );
    var disableDL = !appModel.FileMgrPresent;
    this.controller.setupWidget("toggleAutoDownload",
        this.attributes = { trueValue: true, falseValue: false },
        this.model = { value: appModel.AppSettingsCurrent["UseAutoDownload"], disabled: disableDL }
    );
    this.controller.setupWidget("listAutoDownloadTime",
        this.attributes = {
            label: $L("Download Interval"),
            choices: [
                { label: "5 minutes", value: "00:05:00" },
                { label: "30 minutes", value: "00:30:00" },
                { label: "1 Hour", value: "01:00:00" },
                { label: "2 Hours", value: "02:00:00" },
                { label: "3 Hours", value: "03:00:00" },
                { label: "6 Hours", value: "06:00:00" },
                { label: "12 Hours", value: "12:00:00" },
                { label: "24 Hours", value: "23:59:59" }
            ]
        },
        this.model = { value: appModel.AppSettingsCurrent["AutoDownloadTime"], disabled: disableDL }
    );
    if (appModel.FileMgrPresent)
        this.controller.get("divDownloadExplain").innerHTML = "Frequent automatic downloads can have significant impact on battery life.";
    this.controller.setupWidget("toggleCopyLinkOnShare",
        this.attributes = { trueValue: true, falseValue: false },
        this.model = { value: appModel.AppSettingsCurrent["CopyLinkOnShare"], disabled: false }
    );

    // --- Done Button ---
    this.controller.setupWidget("btnOK", { type: Mojo.Widget.activityButton }, { label: "Done", disabled: false });

    // --- App Menu ---
    this.appMenuAttributes = { omitDefaultItems: true };
    this.appMenuModel = {
        label: "Settings",
        items: [
            Mojo.Menu.editItem,
            { label: "Reset Settings", command: 'do-resetSettings' }
        ]
    };
    this.controller.setupWidget(Mojo.Menu.appMenu, this.appMenuAttributes, this.appMenuModel);
};

PreferencesAssistant.prototype.updateEndpointStatus = function() {
    var statusEl = this.controller.get("divEndpointStatus");
    if (!statusEl) return;
    var url = appModel.AppSettingsCurrent["EndpointURL"];
    if (url && url != "") {
        statusEl.innerHTML = "Using: " + url;
    } else {
        statusEl.innerHTML = "No server configured. Enter your server address below.";
    }
};

PreferencesAssistant.prototype.activate = function(event) {
    Mojo.Event.listen(this.controller.get("listThemePreference"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("listRefresh"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("toggleAutoDownload"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("listAutoDownloadTime"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("toggleCopyLinkOnShare"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("txtCustomClientId"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("txtEndpointURL"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("txtShortURL"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("txtCustomCreateKey"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("toggleForceHTTPS"), Mojo.Event.propertyChange, this.handleValueChange.bind(this));
    Mojo.Event.listen(this.controller.get("btnTestConnection"), Mojo.Event.tap, this.testConnection.bind(this));
    Mojo.Event.listen(this.controller.get("btnOK"), Mojo.Event.tap, this.okClick.bind(this));
};

PreferencesAssistant.prototype.handleValueChange = function(event) {
    Mojo.Log.info(event.srcElement.id + " value changed to " + event.value);

    switch (event.srcElement.id) {
        case "listThemePreference":
            appModel.AppSettingsCurrent["ThemePreference"] = event.value;
            appModel.SetThemePreference(this.controller);
            break;
        case "toggleAutoDownload":
            {
                var dlTimeSetup = this.controller.getWidgetSetup("listAutoDownloadTime");
                dlTimeSetup.model.disabled = !event.value;
                this.controller.modelChanged(dlTimeSetup.model);
                break;
            }
        case "txtEndpointURL":
            // Ensure trailing slash
            if (event.value && event.value.length > 0) {
                var lastChar = event.value[event.value.length - 1];
                if (lastChar != "/") {
                    event.value = event.value + "/";
                }
            }
            // Auto-fill short URL if not yet set
            if (!appModel.AppSettingsCurrent["ShortURL"] || appModel.AppSettingsCurrent["ShortURL"] == "") {
                this.controller.get('txtShortURL').mojo.setValue(event.value);
                appModel.AppSettingsCurrent["ShortURL"] = event.value;
            }
            this.updateEndpointStatus();
            break;
    }

    Mojo.Log.info(event.srcElement.title + " now: " + event.value);
    appModel.AppSettingsCurrent[event.srcElement.title] = event.value;
    appModel.SaveSettings();
};

PreferencesAssistant.prototype.testConnection = function() {
    var endpointURL = this.controller.get('txtEndpointURL').mojo.getValue();
    if (!endpointURL || endpointURL == "") {
        Mojo.Additions.ShowDialogBox("No Server Configured", "Enter a server address before testing the connection.");
        return;
    }
    if (endpointURL[endpointURL.length - 1] == "/") {
        endpointURL = endpointURL.substring(0, endpointURL.length - 1);
    }
    var pingURL = endpointURL + "/ping.php";
    Mojo.Log.info("Testing connection to: " + pingURL);

    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", pingURL);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {
            if (xmlhttp.status == 200) {
                Mojo.Additions.ShowDialogBox("Connection OK", "Successfully reached server at " + endpointURL + ".");
            } else {
                Mojo.Additions.ShowDialogBox("Connection Failed", "Could not reach server at " + endpointURL + ". Check the address and try again.");
            }
        }
    };
};

PreferencesAssistant.prototype.handleCommand = function(event) {
    if (event.type == Mojo.Event.command) {
        switch (event.command) {
            case 'do-goBack':
                Mojo.Controller.stageController.popScene();
                break;
            case 'do-resetSettings':
                appModel.ResetSettings(appModel.AppSettingsDefaults);
                break;
        }
    }
};

PreferencesAssistant.prototype.okClick = function(event) {
    var stageController = Mojo.Controller.getAppController().getActiveStageController();
    stageController.popScene();
};

PreferencesAssistant.prototype.deactivate = function(event) {
    // Compute UseCustomEndpoint from whether a URL is configured
    var endpointURL = appModel.AppSettingsCurrent["EndpointURL"] || "";
    appModel.AppSettingsCurrent["UseCustomEndpoint"] = (endpointURL != "");
    appModel.AppSettingsCurrent["UseCustomClientId"] = true;
    appModel.SaveSettings();
    appModel.EstablishAlarms();

    Mojo.Event.stopListening(this.controller.get("listThemePreference"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("listRefresh"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("toggleAutoDownload"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("listAutoDownloadTime"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("toggleCopyLinkOnShare"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("txtCustomClientId"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("txtEndpointURL"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("txtShortURL"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("txtCustomCreateKey"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("toggleForceHTTPS"), Mojo.Event.propertyChange, this.handleValueChange);
    Mojo.Event.stopListening(this.controller.get("btnTestConnection"), Mojo.Event.tap, this.testConnection);
    Mojo.Event.stopListening(this.controller.get("btnOK"), Mojo.Event.tap, this.okClick);
};

PreferencesAssistant.prototype.cleanup = function(event) {};
