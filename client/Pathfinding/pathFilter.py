import json
import csv
from collections import defaultdict
from math import sqrt

class CSVReader:
    def __init__(self, file):
        self.node_map = {}

        try:
            with open(file, mode='r', newline='', encoding='utf-8') as csvfile:
                reader = csv.reader(csvfile)
                for line in reader:
                    if len(line) < 6:
                        print(f"Skipping invalid line: {','.join(line)}")
                        continue

                    node_id = line[0].strip()
                    node = [value.strip() for value in line[:5]]
                    node += [value.replace('"', '').strip() for value in line[5:]]

                    self.node_map[node_id] = node

        except IOError as e:
            print(f"IO error: {e}")

       # print("Loaded Nodes:", self.node_map.keys())

def initiate(node_map):
    try:
        with open('classes.json', 'r') as f:
            all_classes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        all_classes = []

    try:
        with open('client/src/Cord/path3.json', 'r') as f: #Change accordingly
            floor_classes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        print("Could not load path3.json")#Change accordinngly
        return

   

    floor = all_classes[2]  # Choose floor (change accordingly)

    for class_id in floor:
        current_paths = []  # Resets for next class id
        for path in floor_classes:
            if path and path[-1] == class_id: # Checks if path is empty and access last item
                current_paths.append(path)

        if current_paths: # Checks if there are any content
            print(f"\nPaths to destination {class_id}:") # Debug for destination
            for p in current_paths: #Prints out the paths in a list
                print(p) #Checks (current_paths is a nested list)
            process(current_paths, node_map)

               
def calculate_total_distance(path, node_map):
    total = 0.0
    for i in range(len(path) - 1):
        node_a = node_map[path[i]]
        node_b = node_map[path[i + 1]]
        x1, y1 = float(node_a[2]), float(node_a[3])
        x2, y2 = float(node_b[2]), float(node_b[3])
        total += sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
    return total

def process(curPaths, node_map):
    print("Verify: ", curPaths, "Length:", len(curPaths))

    try:
        with open('finalFilter.json', 'r') as f:
            all_classes = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        all_classes = []

    # Select the shortest path based on total Euclidean distance
    shortest_path = min(curPaths, key=lambda path: calculate_total_distance(path, node_map))
    print("Shortest path:", shortest_path)

    all_classes.append(shortest_path)

    with open('finalFilter.json', 'w') as f:
        json.dump(all_classes, f, indent=2)

    
   


def main():
    csv_file = "/Users/yutian/Desktop/APCS/Hallway-Nav/client/src/Cord/p3.csv"  # Changed backslash to forward slash for better compatibility (can adjust name for file selection)
    reader = CSVReader(csv_file)

    #print("Node Map:", reader.node_map)
    
    initiate(reader.node_map)  # Pass node_map to initiate()


if __name__ == "__main__":
    main()
    
