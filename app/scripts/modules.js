// // FUNC: Connect with the Facebook API and fetch data by keyword(s)
// function connFacebook() {
//   var accessToken = '&access_token='; // Key to add
//   var keywordToSearch = 'journalistiek';
//   var limit = 10;
//
//   $.ajax({type: 'GET', url: 'https://graph.facebook.com/v2.12/search?q='+ keywordToSearch +'&type=page&limit='+ limit +'' + accessToken, success: function(res) {
//     $.each(res.data, function(key, val) {
//       $.ajax({type: 'GET', url: 'https://graph.facebook.com/v2.12/'+ val.id +'?fields=id,name,description,mission,about,website,verification_status,category_list,picture.type(large),fan_count,location' + accessToken, success: function(res) {
//         // Code to add
//       }});
//     });
//   }});
// }

// FUNC: Connect with the Instagram API and fetch data by hashtag(s)
function connInstagram(array, keywordToSearch) {
  $.getJSON('https://allorigins.me/get?url=' + encodeURIComponent('https://instagram.com/') + 'explore/tags/'+ keywordToSearch +'/', function(res) {
    var posts = JSON.parse(res.contents.split('window._sharedData = ')[1].split('\;\<\/script>')[0]).entry_data.TagPage[0].graphql.hashtag;
    var hashtag = posts.name;

    $.each(posts.edge_hashtag_to_top_posts.edges, function(key, val) {
      var post = {
        type: 'instagram',
        hashtag: hashtag,
        image: val.node.display_url,
        text: val.node.edge_media_to_caption.edges[0].node.text,
        likeCount: val.node.edge_media_preview_like.count,
        commentCount: val.node.edge_media_to_comment.count,
        totalCount: (val.node.edge_media_preview_like.count + val.node.edge_media_to_comment.count)
      };

      array.push(post);
    });
  });
}

// FUNC: Connect with the Twitter API and fetch data by hashtag(s)
function connTwitter(array, keywordToSearch, limit) {
  $.ajax({type: 'POST', url: 'twitter_data.php', data: {
    // Keys to add
    'url': 'search/tweets.json?q='+ keywordToSearch +'&result_type=mixed&count='+ limit +''
  }, success: function(res) {
    $.each(res.statuses, function(key, val) {
      var tweet = {
        type: 'twitter',
        keyword: keywordToSearch,
        username: val.user.name,
        profileImage: val.user.profile_image_url_https,
        verified: val.user.verified,
        text: val.text,
        favoriteCount: val.favorite_count,
        retweetCount: val.retweet_count,
        totalCount: (val.favorite_count + val.retweet_count)
      };

      array.push(tweet);
    });
  }});
}

// FUNC: Filter the data (collected from the API's) when filtering is used
function filterData(array, ListToFilter, listMessage, listToProcess) {
  var options = ListToFilter.find('input[type="checkbox"]');
  var defaultOption;
  var selectedOptions = [];

  // Pause until all the data is collected
  $(document).ajaxStop(function() {
    ListToFilter.find('form').removeClass('hide');

    // Clickhandler to close/open each filtertab
    ListToFilter.find('ul li span').on('click', function() {
      $(this).parent().toggleClass('opened');
    });

    $.each(options, function(key, val) {
      if(val.id == 'allekanalen') {
        defaultOption = val;
        selectedOptions.push(defaultOption);
      } else {
        $(val).attr('name', 'platform');
      }

      $(val).on('change', updateFilter);
    });

    updateList();
  });

  // FUNC: Updates filter and selection of posts/tweets after every usage of the filter
  function updateFilter(target) {
    // Check for no duplicates in the selectedOptions array
    var index = selectedOptions.indexOf($(target)[0].target);
    if(index !== -1) {
      selectedOptions.splice(index, 1);
    } else {
      selectedOptions.push($(target)[0].target);
    }

    // Check for defaultOption to be included in the selectedOptions array
    if(selectedOptions.includes(defaultOption)) {
      listMessage.addClass('hide');
      listToProcess.removeClass('hide');

      // Check for filtering when clicked on one of the platforms
      if($(target)[0].target.name && $(target)[0].target.name.length > 0) {
        selectedOptions.splice(selectedOptions.indexOf(defaultOption), 1);
        $(defaultOption).prop('checked', false);
      } else {
        selectedOptions = [];
        selectedOptions.push(defaultOption);

        $.each(options, function(key, val) {
          $(val).prop('checked', false);
        });
        $(defaultOption).prop('checked', true);
      }
    } else {
      listMessage.addClass('hide');
      listToProcess.removeClass('hide');
    }

    updateList();
  }

  // FUNC: Updates selection of posts/tweets after every usage of the filter
  function updateList() {
    // Remove/reset all options as class on listToProcess
    $.each(options, function(key, val) {
      listToProcess.removeClass(val.id);
    });

    // Set all of the selectedOptions as class on listToProcess
    $.each(selectedOptions, function(key, val) {
      listToProcess.addClass(val.id);
      // Rest of the function contains CSS
    });

    // Check for every listitem if they are visible
    var countBlock = 0;
    $.each(listToProcess.find('li'), function(key, val) {
      if($(val).css('display') == 'block') {
        countBlock++;
      }
    });

    // Reset classes
    listMessage.addClass('hide');
    listToProcess.removeClass('hide');

    // If none, show message to inform
    if(listMessage.hasClass('hide') && countBlock == 0) {
      listMessage.removeClass('hide').html('<p>Selecteer een (extra) optie aan de linkerkant om uw inspiratie weer te geven.</p>');
      listToProcess.addClass('hide');
    }
  }
}

// FUNC: Create a skeleton as a result of the chosen options within the filter
function postCreation(breadcrumbs, ListToFilter, listMessage, listToCreate) {
  var inputs = ListToFilter.find('form input');
  var postOptions = [];

  // Clickhandler to close/open each filtertab
  ListToFilter.find('ul li span').on('click', function() {
    $(this).parent().toggleClass('opened');
  });

  // ChangeHandler when filter is used/changed
  inputs.on('change', updateFilter);

  // FUNC: Updates filter and selection of skeletons after every usage of the filter
  function updateFilter() {
    postOptions = [];
    var countKanalen = 0;
    var countBerichttypes = 0;

    $.each($('input:checked'), function(key, val) {
      if(val.type == 'checkbox') {
        countKanalen++;

        postOptions.push({
          'type': 'kanaal',
          'value': val.value
        });
      } else {
        countBerichttypes++;

        postOptions.push({
          'type': 'berichttype',
          'value': val.value
        });
      }
    });

    // Check/uncheck a specific breadcrumb
    if(countKanalen > 0) {
      changeBreadcrumb('Kanalen', 1);
    } else {
      changeBreadcrumb('Kanalen', 0);
    }
    if(countBerichttypes > 0) {
      changeBreadcrumb('Type post', 1);
    } else {
      changeBreadcrumb('Type post', 0);
    }

    // Check if minimal amount of required inputs is selected, if so create the skeleton(s)
    if(countKanalen > 0 && countBerichttypes > 0) {
      listMessage.addClass('hide');
      listToCreate.removeClass('hide').html('<ul></ul>');

      createSkeleton(postOptions);
    } else {
      listMessage.removeClass('hide');
      listToCreate.addClass('hide');
    }
  }

  // FUNC: Change/check the state of the specific breadcrumb after every usage of the filter
  function changeBreadcrumb(string, boolean) {
    $.each(breadcrumbs.find('li:contains('+ string +')'), function(key, val) {
      if(boolean != 0) {
        $(val).addClass('done');
      } else {
        $(val).removeClass('done');
      }
    });
  }

  // FUNC: Creates a skeleton to fill in, on basis of the selected filterinputs
  function createSkeleton(options) {
    // Check selected type of post
    var postType = $.grep(options, function(val, key) {
      return val.type === 'berichttype';
    }, false)[0].value;

    // Print the data into the list
    $.each(options, function(key, val) {
      if(val.type != 'berichttype') {
        // Output Skeleton
        var skeleton = '<li class="item '+ val.value +'">'+
            '<div class="guidelines"><div class="columns large-8"><div class="guidelines__datetime"><div class="date"><p>Optimale dagen om te posten<br></p></div>'+
            '<div class="time"><p>Optimale tijden om te posten<br></p></div></div></div><div class="columns large-14 large-offset-2 end">'+
            '<div class="guidelines__checklist"><ul></ul></div></div></div>'+
            '<div class="skeleton"><form><div class="columns large-11"><textarea rows="3" class="skeleton-text" name="skeleton-text" placeholder="Hoofdtekst van het bericht"></textarea>'+
            '<input type="text" class="skeleton-link" name="skeleton-link" placeholder="Link ter ondersteuning"><ul class="tags"><li>#journalism</li><li>#digitalstorytelling</li>'+
            '<li>#digitalstory</li><li>#futureofjournalism</li><li>#hackathon</li></ul></div><div class="columns large-2"></div><div class="columns large-11 end">'+
            '<div class="skeleton__image"><input type="file" name="skeleton-file" accept="image/*" class="skeleton-file" /><label class="btn">Upload een afbeelding</label>'+
            '<div class="skeleton__preview"></div></div></div></form></div>'+
            '<div class="options"><div class="options__content"><a class="btn second"><span>Publiceren</span></a><form>'+
            '<div class="skeleton-day"><select><option value="" disabled selected>Selecteer een dag</option></select></div>'+
            '<div class="skeleton-time"><select><option value="" disabled selected>Selecteer een tijd</option></select>'+
            '</div><a class="btn"><span>Opslaan als concept</span></a></form></div></div>'+
          '</li>';

        listToCreate.find('> ul').append(skeleton);
      }
    });

    createDynamics(postType, listToCreate.find('> ul > li'));
  }

  // FUNC: Create dynamic content for every type of skeleton
  function createDynamics(postType, listItems) {
    var arrOptimalDatetimes = [
      {type: 'twitter', days: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'], times: ['12:00', '13:00', '15:00', '17:00', '18:00']},
      {type: 'instagram', days: ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag'], times: ['02:00', '08:00', '09:00', '13:00', '17:00']}
    ];
    var arrGuidelines = [
      {type: 'informatief', checklist: ['Gebruik minder dan 80 karakters binnen de hoofdtekst', 'Verpak de boodschap in de afbeelding', 'Ga de dialoog aan door een vraag te stellen', 'Vergeet geen call-to-action toe te voegen als ondersteuning']},
      {type: 'promotie', checklist: ['Breng de boodschap op een positieve manier over', 'Zorg voor een aangrijpende afbeelding', 'Vergeet geen call-to-action toe te voegen als ondersteuning', 'De visie van het bedrijf moet centraal staan in het bericht']},
      {type: 'inhaker', checklist: ['Zorg voor actualiteit in de boodschap', 'Match het onderwerp met de visie van het bedrijf', 'Het bericht moet geen commerciële boodschap bevatten', 'Positiviteit en relevantie moeten centraal staan']},
      {type: 'milestone', checklist: ['Verpak de boodschap in de afbeelding', 'Breng het bericht op een positieve manier over', 'Maak het feestelijk, vier het met jouw volgers', 'Houd de informatie kort en bondig, minder dan 60 karakters']},
      {type: 'vraag-poll', checklist: ['Ga de dialoog aan door een vraag te stellen', 'Wees duidelijk naar jouw lezers toe', 'Kies voor een open of gesloten vraag', 'Zorg voor minimaal 2 antwoordmogelijkheden']},
      {type: 'feit', checklist: ['Zorg voor een aangrijpende afbeelding', 'De lezer moet zich kunnen verplaatsen in de gedachte', 'Wees niet te opdringerig', 'Breng het bericht op een positieve manier over']}
    ];
    var guidelines = $.grep(arrGuidelines, function(val, key) {
      return val.type === postType;
    }, false)[0];

    $.each(listItems, function(listItemKey, listItemVal) {
      var platform = $.grep(arrOptimalDatetimes, function(val, key) {
        return val.type === $(listItemVal).attr('class').split(' ')[1];
      }, false)[0];

      // Set days, times and guidelines
      $.each(platform.days, function(key, val) {
        $(listItemVal).find('.guidelines .guidelines__datetime .date p').append('<span>'+ val +'</span>');
        $(listItemVal).find('.options .skeleton-day select').append('<option value="'+ val +' (aanstaande)">'+ val +' (aanstaande)</option>');
      });
      $.each(platform.times, function(key, val) {
        $(listItemVal).find('.guidelines .guidelines__datetime .time p').append('<span>'+ val +'</span>');
        $(listItemVal).find('.options .skeleton-time select').append('<option value="'+ val +'">'+ val +'</option>');
      });
      $.each(guidelines.checklist, function(key, val) {
        $(listItemVal).find('.guidelines .guidelines__checklist ul').append('<li>'+ val +'</li>');
      });

      // Set preview option
      $(listItemVal).find('.skeleton .skeleton__image input').attr('id', 'skeleton-file-'+ listItemKey);
      $(listItemVal).find('.skeleton .skeleton__image label').attr('for', 'skeleton-file-'+ listItemKey);

      $(listItemVal).find('.skeleton-file').change(function() {
        showPreview(this);
      });

      // Update guidelines on form update
      $(listItemVal).find('.skeleton form').on('change', function() {
        updateGuidelines(listItemVal, this, postType, $(listItemVal).find('.guidelines .guidelines__checklist ul'));
      });
    });
  }

  // FUNC: Update guideline(s) when form gets changed and rules match
  function updateGuidelines(post, form, postType, checklist) {
    // Switch per type of post
    switch(postType) {
      case 'informatief':
        // Guideline 1
        if($(form).find('textarea.skeleton-text').val().length > 0 && $(form).find('textarea.skeleton-text').val().length < 80) {
          checklist.find('li:nth-child(1)').addClass('checked');
        } else {
          checklist.find('li:nth-child(1)').removeClass('checked');
        }

        // Guideline 3
        if($(form).find('textarea.skeleton-text').val().indexOf('?') >= 0) {
          checklist.find('li:nth-child(3)').addClass('checked');
        } else {
          checklist.find('li:nth-child(3)').removeClass('checked');
        }

        // Guideline 4
        if($(form).find('input.skeleton-link').val().length > 0 && $(form).find('input.skeleton-link').val().indexOf('www') >= 0) {
          checklist.find('li:nth-child(4)').addClass('checked');
        } else {
          checklist.find('li:nth-child(4)').removeClass('checked');
        }

        break;
    }

    // Check for checked guideline(s)
    $.each(checklist.find('li'), function(key, val) {
      if($(val).hasClass('checked') == true) {
        $(post).addClass('checked');

        // When clicked on one of the buttons, remove post from container/list
        $.each($('.options .btn'), function(key, val) {
          $(val).on('click', function() {
            $(post).addClass('saved');
          });
        });

        return false;
      } else {
        $(post).removeClass('checked');
      }
    });
  }
}

// FUNC: Process the data collected from the API's
function processData(array, listTitle, listMessage, listToProcess, minimalLikes) {
  var searchedKeywords = [];

  listTitle.addClass('hide');
  listMessage.removeClass('hide').html('<p><b>Even geduld</b>, uw inspiratie wordt verzameld...</p>');
  listToProcess.addClass('hide');

  // Pause until all the data is collected
  $(document).ajaxStop(function() {
    listTitle.removeClass('hide');
    listMessage.addClass('hide');
    listToProcess.removeClass('hide').html('<ul></ul>');

    // Sort the data on total amount of likes/favorites/retweets
    array.sort(function(a, b) {
      return b.totalCount - a.totalCount;
    });

    // Print the data into the list
    $.each(array, function(key, val) {
      // Check for given minimal likes for post/tweet to show
      if(val.totalCount > minimalLikes) {
        // Check the API type for dynamic content
        if(val.type == 'twitter') {
          var verified = '';
          if(val.verified == true) {
            verified = '<span></span>';
          }

          searchedKeywords.push(val.keyword.split('%23')[1]);

          // Output Twitter
          var item = '<li class="item twitter"><a href="#" class="save"></a><div class="top">'+
            '<div class="intro"><figure><img src="'+ val.profileImage +'" alt="'+ val.username +'"></figure><p>'+ val.username + verified +'</p></div>'+
            '<div class="details"><div class="retweets">'+ val.retweetCount +'</div><div class="favorites">'+ val.favoriteCount +'</div></div>'+
            '</div><div class="message"><p>'+ val.text +'</p></div></li>';
        } else if(val.type == 'instagram') {
          searchedKeywords.push(val.hashtag);

          // Output Instagram
          var item = '<li class="item instagram"><a href="#" class="save"></a><div class="top">'+
            '<div class="intro"><figure></figure><p>'+ val.hashtag +'</p></div>'+
            '<div class="details"><div class="comments">'+ val.commentCount +'</div><div class="likes">'+ val.likeCount +'</div></div>'+
            '</div><div class="message"><p>'+ val.text +'</p><figure><img src="'+ val.image +'" alt="'+ val.hashtag +'"></figure></div></li>';
        }

        listToProcess.find('ul').append(item);
      }
    });

    // Collect al the searched keywords and check for duplicates
    var uniqueSearchedKeywords = [];
    $.each(searchedKeywords, function(key, val) {
      if($.inArray(val, uniqueSearchedKeywords) === -1) {
        uniqueSearchedKeywords.push(val);
      }
    });
    // Output each searched keyword
    $.each(uniqueSearchedKeywords, function(key, val) {
      listTitle.find('h3').append('<span>'+ val +'</span>');
    });

    // For every post the "save" option for later purposes
    savePost(listToProcess.find('.item .save'));
  });
}

// FUNC: Save the specific post and divide it from the container/list
function savePost(post) {
  $.each(post, function(key, val) {

    // When clicked on specific post, add/remove class for handling
    $(val).on('click', function(event) {
      event.preventDefault();
      $(this).parent().toggleClass('saved');
    });
  });
}

// FUNC: Show preview when an image is uploaded within the skeleton
function showPreview(input) {
  var imageContainer = $(input).closest('.skeleton__image');
  var previewContainer = $(input).nextAll('.skeleton__preview');

  // Check for image
  if(input.files && input.files[0]) {
    var reader = new FileReader();

    // When reader is loaded
    reader.onload = function(event) {
      imageContainer.addClass('image-added');
      previewContainer.html('<img src="'+ event.target.result +'" alt="Preview">');
    }

    reader.readAsDataURL(input.files[0]);
  }
}

// FUNC: Show the current date and time
function updateDatetime() {
  var div = $('.navigation .datetime');

  var d = new Date();
  var days = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  var months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var time = checkZero(d.getHours()) + ':' + checkZero(d.getMinutes());

  var date = [d.getDate(), months[d.getMonth()], d.getFullYear()].join(' ');
  date = [days[d.getDay()], date].join(', ');
  div.html('<p>'+ [date, time].join(' / ') +'</p>');

  // Repeat function every second
  setTimeout(updateDatetime, 1000);

  // FUNC: Check if current digit is lower than 10, if so add a zero
  function checkZero(d) {
    if(d < 10) {
      d = '0' + d;
    }

    return d;
  }
}
