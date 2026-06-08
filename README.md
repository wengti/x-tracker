1. Scrape data - including name and picture
- save into text file

done

2. Create frontend

PART I: one bey only
- left side is you
- right side is your opponent
- submit button to submit result
    * this hits 1v1 match
- clear button to clear result

done


PART II: 3v3 bey
- same as above 
- below scoreboard show type of finish button
- but extra menu to set ur 3 beyblades
- each time a finish button is clicked, a row appear below it to show finish history
- submit button to submit result
    * this hits 3v3 match and 1v1 match
- clear button to clear result

done


3. Database
parts - name, type, image (done)
users - name, email and pw
3v3 match - userid, blade a1, overblade a1, ... , blade a2.... , blade a3..., blade b1, overblade b1, ... , blade b2.... , blade b3...score
1v1 match - userid, match_id (nullable), type match (1v1 or 3v3), blade a, ... blade b, win or loss, finish type

(done)

4. sign up user and login user and logout
- invalidate expired jwt token
- how to invalidate jwt token that is not expired but logged out

5. A method to save your bey


6. 1v1 results
* on top select the bey setups (can be filtered by whether its your or not yours, or both)
    * total percentage of win / loss
    * number and percentage of different finishes (when win, lose)
    * all match history (should have the option to delete match history, only available for non 3v3 match)
    * below has many many different box, all box has the same bey but different setup
        * within each box:
            * select opponent setups (available based on the selected bey setups)
            * percentage of win / loss
            * number and percentage of different finishes (when win, lose)
            * match history

7. 3v3 results (game profile)
* match history (expandable to see the details)
* win rate or loss rate
* win rate or loss rate of each bey