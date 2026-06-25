# Calculation Algorithm

Variables

totalSpent

bet

reward

profit

roi

For each round

requiredReturn =
totalSpent

- desiredProfit

requiredBet =
requiredReturn
/
rewardMultiplier

bet =
ceil(requiredBet / betStep)

- betStep

if bet < minimumBet

bet = minimumBet

reward =
bet

- rewardMultiplier

totalSpent += bet

profit =
reward

- totalSpent

ROI =
profit
/
totalSpent

Store

Round

Bet

Reward

Spent

Profit

ROI
