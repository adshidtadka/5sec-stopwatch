let userName = $("#user-name").text();

$(function() {
  $(".dropdown-menu .dropdown-item").click(function() {
    var visibleItem = $(".dropdown-toggle", $(this).closest(".dropdown"));
    userName = $(this).attr("value");
    visibleItem.text(userName);
  });

  $("#play-button").on("click", function() {
    window.location.href = "/play?userName=" + userName;
  });

  $("#autoplay-button").on("click", function() {
    window.location.href = "/autoplay?userName=" + userName;
  });
});
