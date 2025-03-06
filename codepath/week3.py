def arrange_guest_arrival_order(arrival_pattern):
  stack = []
  guest_order = []
  
  for i in range(len(arrival_pattern)):
    if arrival_pattern[i] == 'I' and len(stack)==0:
      guest_order.append