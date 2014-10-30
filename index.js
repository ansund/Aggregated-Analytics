(function() {

  // blame viktor ansund
  // Project ID: aha-yoko-742 Project Number: 43897794223
  // https://console.developers.google.com/project/aha-yoko-742
  
  var OAUTH2_CLIENT_ID = '43897794223-33fsd47iostu9i17ci81mq120v1oblgi.apps.googleusercontent.com';
  var OAUTH2_SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics-monetary.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtubepartner',
  'https://www.googleapis.com/auth/youtubepartner-content-owner-readonly'
  ];
  
  var contentOwners; // List of COs (as objects, with co.displayName and co.id)  

  // The Google APIs JS client invokes this callback automatically after loading.
  // See http://code.google.com/p/google-api-javascript-client/wiki/Authentication
  window.onJSClientLoad = function() {
    gapi.auth.init(function() {
      window.setTimeout(checkAuth, 1);

      $('#login-link').click(function() {
        checkAuth();
      });
      $('#runReports').click(function() {
        runAnalyticsForContentOwners();
      });
      $("#contentOwnerTable").on('click', '.COList', function() {
        toggelCheckbox(event.target);
      });
    });
  };

  function checkAuth() {
    gapi.auth.authorize({
      client_id: OAUTH2_CLIENT_ID,
      scope: OAUTH2_SCOPES,
      immediate: false
    }, handleAuthResult);
  }

  // Handle the result of a gapi.auth.authorize() call.
  function handleAuthResult(authResult) {
    if (authResult) {
      // Auth was successful. Hide auth prompts and show things
      // that should be visible after auth succeeds.
      $('.pre-auth').hide();
      $('.post-auth').show();
      loadAPIClientInterfaces();
    } else {
      // Auth was unsuccessful. Show things related to prompting for auth
      // and hide the things that should be visible after auth succeeds.
      $('.post-auth').hide();
      $('.pre-auth').show();
    }
  }

  // Helper method to display a message on the page.
  function displayMessage(message) {
    $('#message').text(message).show();
  }

  // Helper method to hide a previously displayed message on the page.
  function hideMessage() {
    $('#message').hide();
  }

  // Load the client interface for the APIs
  function loadAPIClientInterfaces() {
    gapi.client.load('youtube', 'v3', function() {
      gapi.client.load('youtubeAnalytics', 'v1', function() {
        gapi.client.load('youtubePartner', 'v1', function() {
          getContentOwners();
        }); 
      });
    });
  }

  // Get list of content owners assigned to your account
  function getContentOwners() {
    var request = gapi.client.youtubePartner.contentOwners.list({
      // The fetchMine parameter restricts the result set to content owners associated 
      // with the currently authenticated API user. (boolean)
      fetchMine: true
    });
    request.execute(function(response) { // TODO: Check for forbidden response for no contentowners
      if ('error' in response) {
        console.log('error');
        displayMessage(response.error.message);
      } else {

        if ('items' in response) {
          contentOwners = $.map(response.items, function(item) {
            var co = {
              displayName: item.displayName,
              id: item.id
            }
            return co;
          });

          contentOwners.forEach(function(entry) {
            var contentOwner = entry;
            $('#contentOwnerTable').append(
              '<tr><td><input type="checkbox" class="COList" id="' + contentOwner.id +
              '"/></td><td>' + contentOwner.displayName +
              '</td><td>' + contentOwner.id + '</td></tr>');
          });

        } else {
          displayMessage('There are no content owners asosiated with this account.');
        }
      }
    });
  }

  function toggelCheckbox(target){
    var contentOwner = '#'+target.id;
    var isChecked = $(contentOwner).is(':checked');

    if(isChecked){
      $(contentOwner).attr('checked','checked');
    } else {
      $(contentOwner).removeAttr('checked');
    }
  }

  function runAnalyticsForContentOwners(){
    $(".coData").remove();
    var table = $("#contentOwnerTable");
    // For each row in table
    table.find('tr').each(function (i, el) {
      var contentOwner = $(this).find('.COList');
      //If Checked run nalytics
      if(contentOwner.is(':checked')){
        //Run Report for Content Owner
        getGeneralReport(contentOwner.attr('id'));
      }
    });
  }

// Total viewcounts (and more) for all claimed content
function getGeneralReport(contentOwnerID) {
    var request = gapi.client.youtubeAnalytics.reports.query({
      'start-date': $('#startDate').val(),
      'end-date': $('#endDate').val(),
      ids: 'contentOwner==' + contentOwnerID,
      metrics: 'views,comments,favoritesAdded,likes,dislikes,estimatedMinutesWatched',
      filters: 'claimedStatus==claimed'
    });

    request.execute(function(response) {
      // This function is called regardless of whether the request succeeds.
      // The response either has valid analytics data or an error message.
      if ('error' in response) {
        displayMessage(response.error.message);
      } else {
        addToGeneralReport(response, contentOwnerID);
      }
    });
  }

  function addToGeneralReport(response, contentOwnerID){
    if(response.rows){  // TODO alert of row are 0
      // Puts values from the array in the requested order. 
      // views,comments,favoritesAdded,likes,dislikes,estimatedMinutesWatched
      $('#generalReportBody').append(
        '<tr class="coData"><td>'+ contentOwnerID +
        '</td><td class="views">' + response.rows[0][0] +
        '</td><td class="comments">' + response.rows[0][1] +
        '</td><td class="favoritesAdded">' + response.rows[0][2] +
        '</td><td class="likes">' + response.rows[0][3] +
        '</td><td class="dislikes">' + response.rows[0][4] +
        '</td><td class="estimatedMinutesWatched">' + response.rows[0][5] + '</td></tr>');

      $('#generalReport').show();
      updareTotalRowGeneralReport();
    }
  }

function updareTotalRowGeneralReport(){
  // Update Total row
  var viewsTotal = 0;
  var commentsTotal = 0;
  var favoritesAddedTotal = 0;
  var likesTotal = 0;
  var dislikesTotal = 0;
  var estimatedMinutesWatchedTotal = 0;

  $('#generalReportBody tr').each(function() {
    var views         = parseInt($(this).find(".views").html());
    var comments      = parseInt($(this).find(".comments").html());
    var favoritesAdded = parseInt($(this).find(".favoritesAdded").html());
    var likes         = parseInt($(this).find(".likes").html());        
    var dislikes      = parseInt($(this).find(".dislikes").html());
    var estimatedMinutesWatched = parseInt($(this).find(".estimatedMinutesWatched").html());

    if ($.isNumeric(views))         viewsTotal += views;
    if ($.isNumeric(comments))      commentsTotal += comments;
    if ($.isNumeric(favoritesAdded)) favoritesAddedTotal += favoritesAdded;
    if ($.isNumeric(likes))         likesTotal += likes;
    if ($.isNumeric(dislikes))      dislikesTotal += dislikes;
    if ($.isNumeric(estimatedMinutesWatched)) estimatedMinutesWatchedTotal += estimatedMinutesWatched;
  });

  $('#viewsTotal').html(viewsTotal);
  $('#commentsTotal').html(commentsTotal);
  $('#favoritesAddedTotal').html(favoritesAddedTotal);
  $('#likesTotal').html(likesTotal);
  $('#dislikesTotal').html(dislikesTotal);
  $('#estimatedMinutesWatchedTotal').html(estimatedMinutesWatchedTotal);
}

// THIS IS SAMPLE/TEST CODE; CAN BE REMOVED IF YOU WANT TO. 
// - Don't delete the very last row though




//   // Calls the Data API to retrieve info about the currently authenticated
//   // user's YouTube channel.
//   function getUserChannel() {
//     // https://developers.google.com/youtube/v3/docs/channels/list
//     var request = gapi.client.youtube.channels.list({
//       // "mine: true" indicates that you want to retrieve the authenticated user's channel.
//       mine: true,
//       part: 'id,contentDetails'
//     });

//     request.execute(function(response) {
//       if ('error' in response) {
//         displayMessage(response.error.message);
//       } else {
//         console.log("response gapi.client.youtube.channels.list:");
//         console.log(response);

//         // We will need the channel's channel ID to make calls to the
//         // Analytics API. The channel ID looks like "UCdLFeWKpkLhkguiMZUp8lWA".
//         channelId = response.items[0].id;
//         // This string, of the form "UUdLFeWKpkLhkguiMZUp8lWA", is a unique ID
//         // for a playlist of videos uploaded to the authenticated user's channel.
//         var uploadsListId = response.items[0].contentDetails.relatedPlaylists.uploads;
//         // Use the uploads playlist ID to retrieve the list of uploaded videos.
//         getPlaylistItems(uploadsListId);
//       }
//     });
//   }

//   // Calls the Data API to retrieve the items in a particular playlist. In this
//   // example, we are retrieving a playlist of the currently authenticated user's
//   // uploaded videos. By default, the list returns the most recent videos first.
//   function getPlaylistItems(listId) {
//     // https://developers.google.com/youtube/v3/docs/playlistItems/list
//     var request = gapi.client.youtube.playlistItems.list({
//       playlistId: listId,
//       part: 'snippet'
//     });

//     request.execute(function(response) {
//       if ('error' in response) {
//         displayMessage(response.error.message);
//       } else {
//         console.log("response gapi.client.youtube.playlistItems.list:");
//         console.log(response);

//         if ('items' in response) {
//           // jQuery.map() iterates through all of the items in the response and
//           // creates a new array that only contains the specific property we're
//           // looking for: videoId.
//           var videoIds = $.map(response.items, function(item) {
//             return item.snippet.resourceId.videoId;
//           });

//           console.log("videoIds:");
//           console.log(videoIds);

//           // Now that we know the IDs of all the videos in the uploads list,
//           // we can retrieve info about each video.
//           // getVideoMetadata(videoIds);
//           videoIds.forEach(function(entry) {
//             var videoId = entry;
//             console.log(videoId);
//             displayVideoAnalytics(videoId);
//           });


//         } else {
//           displayMessage('There are no videos in your channel.');
//         }
//       }
//     });
// }

// // Requests YouTube Analytics for a video, and displays results in a chart.
// function displayVideoAnalytics(videoId) {
//   if (channelId) {
//       // To use a different date range, modify the ONE_MONTH_IN_MILLISECONDS
//       // variable to a different millisecond delta as desired.
//       var today = new Date();
//       var lastMonth = new Date(today.getTime() - ONE_MONTH_IN_MILLISECONDS);

//       var request = gapi.client.youtubeAnalytics.reports.query({
//         // The start-date and end-date parameters need to be YYYY-MM-DD strings.
//         'start-date': formatDateString(lastMonth),
//         'end-date': formatDateString(today),
//         // A future YouTube Analytics API release should support channel==default.
//         // In the meantime, you need to explicitly specify channel==channelId.
//         // See https://devsite.googleplex.com/youtube/analytics/v1/#ids
//         ids: 'channel==' + channelId,
//         dimensions: 'day',
//         // See https://developers.google.com/youtube/analytics/v1/available_reports for details
//         // on different filters and metrics you can request when dimensions=day.
//         metrics: 'views',
//         filters: 'video==' + videoId
//       });

//       request.execute(function(response) {
//         // This function is called regardless of whether the request succeeds.
//         // The response either has valid analytics data or an error message.
//         if ('error' in response) {
//           displayMessage(response.error.message);
//         } else {

//           console.log("gapi.client.youtubeAnalytics.reports.query:");
//           console.log(response);

//           // displayChart(videoId, response);
//         }
//       });
//     } else {
//       displayMessage('The YouTube user id for the current user is not available.');
//     }
//   }

  // // Requests YouTube Analytics for a Cntent Owner
  // function displayCOAnalytics(contentOwnerID) {
  //   // To use a different date range, modify the ONE_MONTH_IN_MILLISECONDS
  //   // variable to a different millisecond delta as desired.
  //   var today = new Date();
  //   var lastMonth = new Date(today.getTime() - ONE_MONTH_IN_MILLISECONDS);

  //   var request = gapi.client.youtubeAnalytics.reports.query({
  //     // The start-date and end-date parameters need to be YYYY-MM-DD strings.
  //     'start-date': formatDateString(lastMonth),
  //     'end-date': formatDateString(today),
  //     // A future YouTube Analytics API release should support channel==default.
  //     // In the meantime, you need to explicitly specify channel==channelId.
  //     // See https://devsite.googleplex.com/youtube/analytics/v1/#ids
  //     ids: 'contentOwner==' + contentOwnerID,
  //     // See https://developers.google.com/youtube/analytics/v1/available_reports for details
  //     // on different filters and metrics you can request when dimensions=day.
  //     metrics: 'views,estimatedMinutesWatched,earnings,monetizedPlaybacks,impressions',
  //     dimensions: 'video',
  //     filters: 'claimedStatus==claimed', // 'uploaderType==self', 
  //     'max-results': '10',
  //     sort: '-views'
  //   });

  //   request.execute(function(response) {
  //     // This function is called regardless of whether the request succeeds.
  //     // The response either has valid analytics data or an error message.

  //     if ('error' in response) {
  //       displayMessage(response.error.message);
  //     } else {
  //       console.log("CONTEN OWNER: " + contentOwnerID);
  //       console.log(response);
  //     }
  //   });
  // }

})();
