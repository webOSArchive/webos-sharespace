function SetupAssistant() {}

SetupAssistant.prototype.setup = function() {
    this.controller.setupWidget("btnSetupPreferences",
        { type: Mojo.Widget.defaultButton },
        { label: "Configure Server", buttonClass: "affirmative", disabled: false }
    );
    this.controller.setupWidget("btnSetupSkip",
        { type: Mojo.Widget.defaultButton },
        { label: "Skip for Now", buttonClass: "negative", disabled: false }
    );
    this.controller.setupWidget(Mojo.Menu.appMenu, { omitDefaultItems: true }, { visible: false });
};

SetupAssistant.prototype.activate = function(event) {
    Mojo.Event.listen(this.controller.get("btnSetupPreferences"), Mojo.Event.tap, this.openPreferences.bind(this));
    Mojo.Event.listen(this.controller.get("btnSetupSkip"), Mojo.Event.tap, this.skipSetup.bind(this));
    // When returning from Preferences, auto-advance to main if an endpoint is now configured
    if (appModel.AppSettingsCurrent["EndpointURL"] && appModel.AppSettingsCurrent["EndpointURL"] != "") {
        var stageController = Mojo.Controller.getAppController().getActiveStageController();
        stageController.swapScene({ transition: Mojo.Transition.crossFade, name: "main" });
    }
};

SetupAssistant.prototype.openPreferences = function() {
    var stageController = Mojo.Controller.getAppController().getActiveStageController();
    stageController.pushScene({ name: "preferences", disableSceneScroller: false });
};

SetupAssistant.prototype.skipSetup = function() {
    this.controller.showAlertDialog({
        onChoose: function(value) {
            if (value == "continue") {
                var stageController = Mojo.Controller.getAppController().getActiveStageController();
                stageController.swapScene({ transition: Mojo.Transition.crossFade, name: "main" });
            }
        },
        title: "No Server Configured",
        message: "Without a server address, Share Space cannot connect to anything. You can configure one later in Preferences.",
        choices: [
            { label: "Continue Anyway", value: "continue", type: "negative" },
            { label: "Go Back", value: "back", type: "affirmative" }
        ]
    });
};

SetupAssistant.prototype.deactivate = function(event) {
    Mojo.Event.stopListening(this.controller.get("btnSetupPreferences"), Mojo.Event.tap, this.openPreferences);
    Mojo.Event.stopListening(this.controller.get("btnSetupSkip"), Mojo.Event.tap, this.skipSetup);
};

SetupAssistant.prototype.cleanup = function(event) {};
