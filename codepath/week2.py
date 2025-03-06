def total_treasures(treasure_map):
    total = 0
    for key in treasure_map:
        total += treasure_map[key]
    return total

treasure_map1 = {
    "Cove": 3,
    "Beach": 7,
    "Forest": 5
}


def can_trust_message(message):
    dict_chars = {}
   
    
    for char in message.replace(" ", ""):
        if char in dict_chars:
            continue
        else:
            dict_chars[char] = 1
    return (total_treasures(dict_chars)) == 26

message1 = "sphinx of black quartz judge my vow"
message2 = "trust me"

print(can_trust_message(message1))
print(can_trust_message(message2))