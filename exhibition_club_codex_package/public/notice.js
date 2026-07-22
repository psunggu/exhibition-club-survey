(function () {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();

  var headings = document.querySelectorAll(".mon");
  for (var i = 0; i < headings.length; i++) {
    var match = headings[i].textContent.match(/(\d{4})년\s*(\d{1,2})월/);
    if (!match || Number(match[1]) !== year || Number(match[2]) !== month) continue;

    var cal = headings[i].nextElementSibling;
    if (!cal || !cal.classList.contains("cal")) continue;

    var nums = cal.querySelectorAll(".cell .dnum");
    for (var j = 0; j < nums.length; j++) {
      if (Number(nums[j].textContent.trim()) !== day) continue;
      nums[j].classList.add("is-today");
      var label = document.createElement("span");
      label.className = "tlab";
      label.textContent = "오늘";
      nums[j].insertAdjacentElement("afterend", label);
      return;
    }
  }
})();
