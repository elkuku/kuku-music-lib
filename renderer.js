$(function () {

    const
        {dialog} = require('electron').remote,
        Conf = require('conf'),
        config = new Conf(),
        fs = require('fs'),
        path = require('path'),
        ejs = require('ejs'),
        pjson = require('./package.json'),
        request = require('request'),
        configmod = require('./configmod');

    setup()

    function download(uri, filename, callback) {
        request.head(uri, function (err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);

            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        });
    }

    function setup() {
        // Check if "Wheit" (Light) theme is selected
        if ('Bläk' == config.get('theme')) {
            $('head link#styleSheet').attr('href', 'css/example_dark.css');
        }

        $('.header.row.navi').html(loadTemplate('cmdBox', {}));

        $('footer').prepend('<img src="img/logo.png" height="24px"/> ' + pjson.productName + ' ' + pjson.version + ' - ');

        initContent()

        // Setup buttons
        var cmdBox = $('.cmdBoxNavi');

        cmdBox.find('[data-toggle=config]').on('click', function () {
            configmod.show();
            showConfig();
        });

        cmdBox.find('[data-toggle=reload]').on('click', function () {
            reload();
            initContent(loadTemplate('alert', {type: 'info', message: 'Reload finished.'}));
        });

        cmdBox.find('[data-toggle=theme]').on('click', function () {
            var e = $('head link#styleSheet');

            if (e.attr('href').indexOf('dark') > 0) {
                e.attr('href', 'css/example.css');
            } else {
                e.attr('href', 'css/example_dark.css');
            }
        });

        if (!config.get('workDir')) {
            console.log('no work dir');
            showConfig();
        }
        else {
            if (fs.existsSync(config.get('workDir'))) {
                initContent();
                reload();
            }
            else {
                dialog.showErrorBox('Invalid Path', 'The working directory path set in configuration is invalid');
                showConfig();
            }

            $('#btnRequestLastFM').on('click', function () {
                getAlbumInfo($('#artist').val(), $('#album').val());
            })
        }
    }

    /**
     * Load a ejs template.
     *
     * @param name
     * @param object
     *
     * @returns {String}
     */
    function loadTemplate(name, object) {
        var tpl = fs.readFileSync(__dirname + '/partials/' + name + '.ejs');
        return ejs.render(tpl.toString(), object);
    }

    function initContent(message) {
        $('#header').html('<h2><img src="img/logo.png" height="70px"/> ' + pjson.productName + ' <code>' + pjson.version + '</code></h2>');
        $('#content').html(loadTemplate('alert', {type: 'info', message: 'Hey there&hellip;'}));

        if (message) {
            $('#console').html(message);
        }
    }

    function getAlbumInfo(artist, album) {
        $('#content').html(loadTemplate('alert', {type: 'info', message: 'Requesting&hellip;'}));

        var lastFm = require('./lastfm')

        lastFm.getAlbumInfo(artist, album, updateInfo)
    }

    function updateInfo(info) {
        console.log(info);

        var workDir = config.get('workDir');

        workDir += '/' + $('#folderArtist').html()
        workDir += '/' + $('#folderAlbum').html()

        $('#content').html(loadTemplate('albumInfo', {album: info}));

        $('#btnSaveAlbumInfo').on('click', function () {
            $('#console').html('Saving...');

            $('#coverImages li').each(function (idx, li) {
                var url = $(li).data('url')

                var size = $(li).html()

                var fileName = 'cover'

                if(size) {
                    fileName += '_' + size
                }

                download(url, workDir + '/' + fileName + '.png', function () {
                })

            })

            $('#console').html('Finished.');
        })
    }

    function loadAlbumList(dir) {
        var albums = getDirectories(dir);
        var container = $('#albumList');

        //console.log(dir);

        container.empty();

        for (let album of albums) {

            var li = $('<li>' + album + '</li>');

            li.on('click', function () {
                $(this).parent().find('li').removeClass('active');
                $(this).addClass('active');
                $('#album').val(album.replace(/^\d{4} - /, ""));
                $('#folderAlbum').html(album);
            });

            li.appendTo(container);
        }
    }

    /**
     * Reload the whole story.
     */
    function reload() {
        var workDir = config.get('workDir');
        var dirs = getDirectories(workDir);
        var container = $('#navigation');

        container.empty();

        for (let dir of dirs) {

            var li = $('<li>' + dir + '</li>');

            li.on('click', function () {
                $(this).parent().find('li').removeClass('active');
                $(this).addClass('active');
                $('#artist').val(dir);
                $('#folderArtist').html(dir);
                loadAlbumList(workDir + '/' + dir);
            });

            li.appendTo(container);
        }
    }

    /**
     * Show the configuration.
     */
    function showConfig() {
        $('#header').html('<h3><img src="img/logo.png" height="70px"/> Configuration</h3>');
        $('#content').html(loadTemplate('config', {o: config}));
        $('#console').html('');

        $('#btnSaveConfig').on('click', function () {
            saveConfig();
        });

        $('#cfgTheme').on('change', function () {
            var e = $('head link#styleSheet');

            if ('Bläk' == $(this).val()) {
                e.attr('href', 'css/example_dark.css');
            } else {
                e.attr('href', 'css/example.css');
            }
        });
    }

    /**
     * Save the configuration.
     */
    function saveConfig() {
        var workDir = $('#cfgWorkDir').val(),
            theme = $('#cfgTheme').val(),
            debug = $('#cfgDebug').is(':checked');

        if (false === fs.existsSync(workDir)) {
            dialog.showErrorBox('Invalid Path', 'The example directory path is invalid');
            return;
        }

        config.set('workDir', workDir);
        config.set('debug', debug);
        config.set('theme', theme);

        initContent(loadTemplate('alert', {type: 'info', message: 'Config saved.'}));
    }

    function getDirectories(srcPath) {
        return fs.readdirSync(srcPath).filter(function (file) {
            return fs.statSync(path.join(srcPath, file)).isDirectory();
        });
    }

});
