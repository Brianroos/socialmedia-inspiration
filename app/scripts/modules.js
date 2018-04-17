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

// FUNC: Process the data collected from the API's
function processData(array, listToProcess, minimalLikes) {
  listToProcess.html('<p>Even geduld, jouw inspiratie wordt verzameld..</p>');

  $(document).ajaxStop(function() {
    listToProcess.html('<ul></ul>');

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

          // Output Twitter
          var item = '<li class="item twitter"><a href="#" class="save"></a><div class="top">'+
            '<div class="intro"><figure><img src="'+ val.profileImage +'" alt="'+ val.username +'"></figure><p>'+ val.username + verified +'</p></div>'+
            '<div class="details"><div class="retweets">'+ val.retweetCount +'</div><div class="favorites">'+ val.favoriteCount +'</div></div>'+
            '</div><div class="message"><p>'+ val.text +'</p></div></li>';
        } else if(val.type == 'instagram') {
          // Output Instagram
          var item = '<li class="item instagram"><a href="#" class="save"></a><div class="top">'+
            '<div class="intro"><figure></figure><p>'+ val.hashtag +'</p></div>'+
            '<div class="details"><div class="comments">'+ val.commentCount +'</div><div class="likes">'+ val.likeCount +'</div></div>'+
            '</div><div class="message"><p>'+ val.text +'</p><figure><img src="'+ val.image +'" alt="'+ val.hashtag +'"></figure></div></li>';
        }

        listToProcess.find('ul').append(item);
      }
    });
  });
}
