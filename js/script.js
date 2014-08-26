if (window.jQuery) {
    
    $(function() {
        var $window = $(window),
        offset = $( '.container' ).offset();
        $window.scroll(function() {
            if (offset) {
                if ($window.scrollTop() > offset.top) {
                    $( '.loading' ).css( { top: $window.scrollTop() - offset.top } );
                } else {
                   $( '.loading' ).css( { top: 'auto' } );
                }
            }
        });
    });
    
    var $data = $('#data'),
    $playlist = $('#playlist'),
    $nodata = $('#nodata');
    
    $(window).bind('load', function() {
        isMobile = (/(Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini)/).test(navigator.userAgent);
        if (isMobile) $('body').addClass('mobile');
        doSortable( $playlist );
        if (!supportsLocalStorage()) {
            $('.save').addClass('nope');
        } else {
           var savedPlaylistObj = localStorage['playlistObj'];
           if (isJson(savedPlaylistObj)) {
                var collection = populateList(JSON.parse(savedPlaylistObj));
                if (collection !== false) {
                    $playlist.html(collection);
                    $('.factor').show();
                    $('.see').click();
                    updateList($playlist);
                }
           }
        }
    });
    
    $(document).on('click', '.see', function(e) {
        if ($(this).hasClass('.nope')) return;
        var $that = $(this);
        $that.toggleClass('active').promise().done(function(e) {
            if (e.hasClass('active')) {
                $playlist.show();
                $nodata.hide();
                $data.hide();
                $('body').addClass('list-area');
            } else {
                $playlist.hide();
                $data.show();
                $('body').removeClass('list-area');
            }
        });
        e.preventDefault();
        e.stopPropagation();
    });

    $(document).on('click', '.save', function(e) {
        var playlist = [],
        playlistObj = {};
        
        $.each($('#playlist > div'), function() {
            var $that = $(this),
            trackObj = {},
            tags = '',
            $inputTags = $that.find('.a_tags');
            
            if ($inputTags.val() !== undefined && $inputTags.val().length > 0) {
                var toObj = $inputTags.val().replace(/\s+/g, ''),
                tags = toObj.split(',')
            }
            
            trackObj['artists'] = $that.find('.artists').html();
            trackObj['song'] = $that.find('.song').html();
            trackObj['album'] = $that.find('.album').html();
            trackObj['duration'] = $that.attr('data-dur');
            trackObj['popularity'] = $that.find('.popularity').html();
            trackObj['tags'] = $.isArray(tags) ? tags : '';
            playlist.push(trackObj);
        });
        
        for (var i = 0; i < playlist.length; ++i)
            playlistObj[i] = playlist[i];
            
        localStorage['playlistObj'] = JSON.stringify(playlistObj);
        $(this).removeClass('warning');
        e.preventDefault();
        e.stopPropagation();
    });
    
    $(document).on('click', '.remove', function(e) {
        $(this).closest('.row').addClass('removing').delay(400).queue(function() {
            $(this).closest('.row').remove();
            updateList( $playlist );
            if ($('#playlist > div').length < 1) {
                if ($('.see').hasClass('active')) $('.see').click();
                $('.factor').hide();
                if (supportsLocalStorage()) localStorage.clear();
            }
            $(this).dequeue();
        });
        $('.save').trigger('madeChanges');
        e.preventDefault();
        e.stopPropagation();
    });
    
    $('.save').on('madeChanges',function(){
        if ( !$(this).hasClass('warning') ) $(this).addClass('warning');
    });
    
    $(document).on('click', '.add', function(e) {
        $(this).closest('.row').addClass('adding').delay(400).queue(function() {
            $(this).closest('.row').removeClass('adding');
            var cloned = $(this).clone();
            cloned.find('.clearfix').html('<div class="tags notags"><span class="tag-icn icn"></span><input type="text" value="" class="a_tags" name="tags" placeholder="Tags: Weekend, house, rock, etc."></div><div class="remove"><span class="remove-icn icn"></span></div>');
            cloned.appendTo('#playlist');
            updateList( $playlist );
            if ( !$( '.factor' ).is(':visible') ) $( '.factor' ).show();
            $(this).dequeue();
        });
        $('.save').trigger('madeChanges');
        e.preventDefault();
        e.stopPropagation();
    });
    
    $(document).on('click', '.tags > .icn', function(e) {
        $(this).closest('.clearfix').toggleClass('on');
        e.preventDefault();
        e.stopPropagation();
    });
    
    $(document).on('keyup', '.a_tags', function(e) {
        if (e.keyCode == 13) {
            var $input = $(this), val = $(this).val();
            
            if (val.length > 0) {
                $input.parent().removeClass('notags');
                var toObj = val.replace(/\s+/g, ''),
                tags = toObj.split(','),
                toVal = '';
                
                for (var i = 0; i < tags.length; ++i) {
                    toVal += i > 0 ? ', ' + tags[i]  : tags[i]; 
                }
                $input.val(toVal);
            } else {
                if (!$input.parent().hasClass('notags')) $input.parent().addClass('notags');
            }
            
            $input.blur();
            $('.save').trigger('madeChanges');
            $(this).closest('.clearfix').toggleClass('on');
        }
    });
    
    $(document).on('click', '.ui-autocomplete > li', function(e) {
        $('#q').blur();
        $('#search-form').submit();
        e.preventDefault();
        e.stopPropagation();
    });
    
    $('#q').bind('blur', function(){ $(this).parent().removeClass('focused'); });
    $('#q').bind('focus', function(){ $(this).parent().addClass('focused'); });    
    
    $('#q').autocomplete({
        minLength: 3,
        focus: function() {
          return false;
        },
        source: function(request, response) {
            $.ajax({
                url: 'http://ws.spotify.com/search/1/track.json',
                data: { q: $('#q').val() },
                dataType: "json",
                success: function(data) {
                    if (data.info['num_results'] > 0) {
                        var suggestions = [];
                        for ( var i=0; i < 10; i++ ) {
                            if (data.tracks[i] !== undefined) {
                                if ($.inArray(data.tracks[i].artists[0].name + ' - ' + data.tracks[i].name, suggestions) == -1) suggestions.push(data.tracks[i].artists[0].name + ' - ' + data.tracks[i].name);
                            }
                            
                        }                        
                        response($.map(suggestions, function(c) {
                            return c;
                        }));
                    }
                }
            });
        }
    });
    
    $(document).ajaxStart(function() {
        $('.loading').show();
    });
    
    $(document).ajaxStop(function() {
        $('.loading').hide();
    });
    
    $( '#search-form' ).submit(function() {
        var $input = $('#q');
            
        if ($input.val().length > 0) {
            $nodata.hide();
            $input.blur();
            search_value = $input.val();
            if(!$data.is(':visible')) $('.see').click();
            $data.html('');
            getData(search_value, 1, true, handleData);
        } else {
            $input.focus();
        }
        
        return false;
    });
    
    $(window).scroll(function() {
        if ( $(window).scrollTop() == $(document).height() - $(window).height() ) {
            if ( $('> div', data).length > 0 && $data.is(':visible') && $data.is(':visible') && current_page < 9 && current_page <= total_pages ) {
                current_page++;
                getData(search_value, current_page, false, handleData);
            }
        }
    });
}

Number.prototype.toMMSS = function () {
    var sec_num = parseInt(this, 10);
    var minutes = parseInt( sec_num / 60 ) % 60;
    var seconds = sec_num % 60;
    if (seconds < 10) {seconds = "0" + seconds;}
    var time = minutes + ' : ' + seconds;
    return time;
}

Number.prototype.toHHMM = function () {
    var sec_num = parseInt(this, 10);
    var hours = parseInt( sec_num / 3600 ) % 24;
    minutes = parseInt( sec_num / 60 ) % 60;
    if (minutes)var time = (hours > 0 ? hours + ' hr' + (hours > 1 ? 's' : '') + ' ' : '') + minutes + ' min' + (minutes > 1 ? 's' : '');
    return time;
}

Array.prototype.arrStr = function () {
    var str = '';
    var arr = this;
    if ($.isArray(arr)) {
        for (var i = 0; i < arr.length; ++i)
        str += i > 0 ? ', ' + arr[i]  : arr[i];
    }
    return str;
}

function doSortable(e) {
    if (e.length > 0) {
        e.sortable({
            items: '.tr',
            placeholder: "tr tr-placeholder",
            start: function(event, ui) {
                ui.item.data('start_weight', ui.item.index());
            },
            stop: function(event, ui) {
                var start_weight = ui.item.data('start_weight');
                if (start_weight != ui.item.index()) $('.save').trigger('madeChanges');
            }
        });
    }
}

function getData(val, page, async, callback) {
    $.ajax({
        async: async !== false ? true : false, 
        type: "GET",
        url: 'http://ws.spotify.com/search/1/track.json',
        dataType: 'json',
        data: {
            q: val,
            page: page
        },
        error: function() {
          $nodata.show();
        },
        success: callback
    });
}

function handleData(data) {
    var num_results = data.info['num_results'];
    if (num_results > 0) {
        limit = data.info['limit'];
        total_pages = Math.round(num_results / limit);
        if (typeof current_page === 'undefined') current_page = 1;
        // remove duplicate objects
        var arr = {}, collection = '';
        for ( var i=0; i < limit; i++ ) {
            if (data.tracks[i] !== undefined) {
                arr[data.tracks[i].album['name']] = data.tracks[i];    
            }
            
        }
        
        data.tracks = new Array();
        for ( var key in arr )
            data.tracks.push(arr[key]);
    
        $.each(data.tracks, function() {
            var duration, artists = '', duration = this.length.toMMSS();
            $.each(this.artists, function(idx) { artists += idx > 0 ? ', ' + this.name : this.name; });
            collection += '<div class="row tr" data-dur="' + this.length + '" data-pop="' + this.popularity + '"><div class="td artists">' + artists + '</div><div class="td song">' + this.name + '</div><div class="td album">' + this.album['name'] + '</div><div class="td duration">' + duration + '</div><div class="td popularity">' + this.popularity + '</div><div class="clearfix"><div class="add"><span class="add-icn icn"></span></div></div></div>';
        });
        $data.html( collection );
    } else {
       $nodata.show();
    }
}

function populateList(obj) {
    if (obj == null || obj.length === 0) return false;
    var collection = '';
    $.each(obj, function() {
        collection += '<div class="row tr" data-dur="' + this.duration + '" data-pop="' + this.popularity + '"><div class="td artists">' + this.artists + '</div><div class="td song">' + this.song + '</div><div class="td album">' + this.album + '</div><div class="td duration">' + parseFloat(this.duration).toMMSS() + '</div><div class="td popularity">' + this.popularity + '</div><div class="clearfix"><div class="tags' + ($.isArray(this.tags) ? '' : ' notags') + '"><span class="tag-icn icn"></span><input type="text" placeholder="Tags: Weekend, house, rock, etc." name="tags" class="a_tags" value="' + ($.isArray(this.tags) ? this['tags'].arrStr() : '') + '" /></div><div class="remove"><span class="remove-icn icn"></span></div></div></div>';
    });
    if (collection.length > 0) {
        return collection;
    }
    return false;
}

function updateList(e) {
    if (e.length > 0) {
        var duration, coolness;
        duration = calcListDuration(e);
        coolness = calcCoolnessFactor(e);
        if (duration) $( '#duration' ).html(duration.toHHMM());
        $( '#factor' ).html(coolness === false ? 0 : coolness);
    }
}

function calcListDuration(e) {
    if (e.length > 0) {
        var dur = 0;
        $.each($('.tr', e), function() {
            dur = dur + parseFloat($(this).attr('data-dur'))
        });
        if (dur > 0) return dur;
    }
    return false; 
}

function calcCoolnessFactor(e) {
    if (e.length > 0) {
        var dur = pop = sum = 0, coolnessf;
        $.each($('.tr', e), function() {
            sum = sum + (parseFloat($(this).attr('data-dur')) * parseFloat($(this).attr('data-pop')));
            dur = dur + parseFloat($(this).attr('data-dur'))
        });
        coolnessf = Number((sum / dur).toFixed(2));
        if (coolnessf > 0) return coolnessf;
    }
    return false; 
}

function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    } catch (e) {
        return false;
    }
}

function isJson(val) {
    try {
        JSON.parse(val);
    } catch (e) {
        return false;
    }
    return true;
}
