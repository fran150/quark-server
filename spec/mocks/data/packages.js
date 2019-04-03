module.exports = {
    reset: function() {
        this.data = JSON.parse(JSON.stringify(this.original));
    },
    original: {
        "bootstrap": {
            "name": "bootstrap",
            "dateCreated": new Date(2018, 8, 14),
            "dateModified": null,
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "2@x": {
                    "paths": {
                        "bootstrap/js": "bootstrap/js/bootstrap.min",
                        "bootstrap/css": "bootstrap/css/bootstrap.min"
                    },
                    "shims": {
                        "bootstrap/js": ["jquery"]
                    }
                },
                "3@x": {
                    "paths": {
                        "bootstrap/js": "bootstrap/dist/js/bootstrap.min",
                        "bootstrap/css": "bootstrap/dist/css/bootstrap.min"
                    },
                    "shims": {
                        "bootstrap/js": ["jquery"]
                    }
                }                
            }
        },
        "qk-alchemy": {
            "name": "qk-alchemy",
            "dateCreated": new Date(2018, 9, 14),
            "dateModified": null,
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1@x": {
                    "paths": {
                        "qk-alchemy": "qk-alchemy"
                    }
                }
            }
        },
        "qk-bootstrap": {
            "name": "qk-bootstrap",
            "dateCreated": new Date(2018, 10, 14),
            "dateModified": null,
            "author": "fran150",
            "email": "panchi150@gmail.com",
            "versions": {
                "1@x": {
                    "paths": {
                        "qk-bootstrap": "qk-bootstrap"
                    }
                }
            }
        }
    }
}