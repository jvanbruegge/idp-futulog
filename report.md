# Project report: futuLog

## Table of contents

<!-- toc -->

## Introduction

Due to the COVID-19 pandemic, in the first half of 2020, Futurice had all employees work from home. As the restrictions were partly lifted and some people needed material or equipment from the office, a system had to be put in place to trace contracts. The german government required that in case of a positive COVID-19 test, all other employees that were in contact with the positive individual need to be contacted in order to be tested themselves.

At first, this was accomplished with an Excel spreadsheet that everyone could write to. However, this approach quickly showed severe limitations. It was hard hard to use, especially on mobile devices, e.g. it was very easy to accidentaly delete other cells or be off by one column and sign in as another employee. As a result of that, only about 50% of the people that went to the office actually signed into the sheet. Additionally there were some privacy concerns. With the spreadsheet, all historical data was collected for everyone to see, so if anyone was aware that there had been a positive case at a certain date, they could just look up the date and guess who was the person in question.

These concrete problems formed the requirements for the development of an application to do the tracing:

- Easy to use, with first class mobile support
- Only a small group (administrators) can see past data for privacy
- Can export a list of all people that were in contact with a given person in the last two weeks (again only for administrators)

The application that was developed in turn was later called **futuLog**.

## Impact

TODO: Explain what what the diagrams say

<style>
#pairs_bars_date {
  width: 100%;
}
.bar {
  fill: steelblue;
}
</style>

<div>
  <svg id="pairs_bars"></svg>
  <div class="line">
    <label for="pairs_bars_date">Date: <span id="pairs_bars_value"></span></label>
    <button id="pairs_bars_play">Play</button>
    <div class="office">
      <input id="pairs_bars_Munich" type="checkbox" checked></input>
      <label for="pairs_bars_Munich">Munich</label>
    </div>
    <div class="office">
      <input id="pairs_bars_Berlin" type="checkbox" checked></input>
      <label for="pairs_bars_Berlin">Berlin</label>
    </div>
    <div class="office">
      <input id="pairs_bars_Stuttgart" type="checkbox" checked></input>
      <label for="pairs_bars_Stuttgart">Stuttgart</label>
    </div>
    <div class="office">
      <input id="pairs_bars_Helsinki" type="checkbox" checked></input>
      <label for="pairs_bars_Helsinki">Helsinki</label>
    </div>
    <div class="office">
      <input id="pairs_bars_Tampere" type="checkbox" checked></input>
      <label for="pairs_bars_Tampere">Tampere</label>
    </div>
  </div>
  <input id="pairs_bars_date" type="range"></input>
</div>
