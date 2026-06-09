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
1v1 match - userid, match_id (nullable), blade a, ... blade b, win or loss, finish type

(done)

4. sign up user and login user and logout

logout
- clear local storage name
- invalidate expired jwt token 
- how to invalidate jwt token that is not expired but logged out

(DONE)

5. fetch selection from the database
(Done)

6. submit result 1v1 and 3v3 (need to sanitize the data on backend)
(Done)

7. A method to save your bey
go under profile
(Done)


8. Need to update table to show the time created of the match


9. Blade Stats page 

this page should be linkable from saved blade, so use path parameter

on top: search feature

for each bey
* win loss percentage - in 1v1, 3v3 and total
* type of finishes percentage
* all match history

next: search feature for the opponent blades - to restrict the match history
* win loss percentage - in 1v1, 3v3 and total
* type of finishes
* all match history

10. Personal Stats Page
* win rate or loss rate
* win rate or loss rate of each bey
* match history (expandable to see the details)


