import json
import csv

od = {}

with open('combos.csv', encoding="utf8") as csvfile:
    creader = csv.reader(csvfile)
    i = 0
    for row in creader:
        od[row[0]] = {
            "base": row[1],
            "left_word": row[2],
            "right_word": row[3],
            "left_partials": list(map(str.strip, row[4].split(',')))[:-1],
            "right_partials": list(map(str.strip, row[5].split(',')))[:-1]
        }
        i += 1

with open("chords.json", "w") as outfile:
    json.dump(od, outfile, indent=4)
