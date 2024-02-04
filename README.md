# Augvoker Log Analysis Thing

A tool that helps you plan out your Ebon Mights and Presciences.

## How It Works
1. Enter a WarcraftLogs report url and choose a fight.
2. Select a fight from the dropdown.
    * If your report url contains a fight numnber, the fight will be selected automatically.
3. Choose what type of damage you want to optimize for:
    * Boss Only - Only the boss :)
    * Essential Targets - For fights (like Fyrakk) with periods of time where the boss isn't attackable. This setting includes additional high-priority targets.
    * All Targets
4. If the boss you're analyzing has any periods of time with nothing to attack or periods where you want to skip damage analysis entirely, you can add them in the "Forced Downtime" section.
    * The tool assumes 0 Ebon Might uptime and 0 prescience casts during these periods.
    * Prescience's cooldown will continue to tick during these periods, so if the period is longer than prescience's cooldown, you will start the next EM period with 2 charges.
5. Optionally, you can enable the "Use Advanced Timings" toggle.
    * This lets you fine-tine each cast of ebon might and prescience.
    * This is also where you can indicate that you are pre-casting prescience before the pull to start with a "long duration" prescience.
    * Most importantly, you can import timings from a log and then apply those timings to your log.
      * For example, you can grab a top parsing aug log from WCL or Lorrgs, put the log into this tool, copy the EM and prescience timings, then put in your log and calculate it.
6. Calculate!
    * You'll see a table of the top 4 damagers for each of your configured EM windows.
      * Each prescience cast will appear next to the target's name in parenthesized smaller text.
      * If a name doesn't have a prescience timestamp next to it, it's not included in that EM window.
    * If everything looks right, you can slap the provided MRT note into your personal MRT note in-game and you're good to go!
7. If your selected Prescience and Ebon Might timings result in any presciences that expire before you cast Ebon Might, those presciences will be highlighted with an exclamation mark.
    * You can try shifting your casts back/forward if you need to guarantee 3/4 of your EM targets for a specific burn, but a couple ineffective prescience casts are generally fine.

## Live Site
https://augvoker.netlify.app/

## Required in-game WeakAuras
* [Prescience Glows](https://wago.io/yrmx6ZQSG) - Glows your assigned target's frames when its time to use prescience.
* Optional - [Kaze's MRT WeakAura](https://wago.io/n7l5uN3YM) - Reminds you to use Ebon Might at the configured times.
    * Consult the description of the WA for how to set up fancy stuff like TTS or adjust how far in advance it will remind you.

## Running Locally
### Setup
```
npm install
```
Create a `.env` file in the root directory with a `WCL_API_KEY` entry that contains your WarcraftLogs v1 API key.
### Running
```
netlify run dev
```