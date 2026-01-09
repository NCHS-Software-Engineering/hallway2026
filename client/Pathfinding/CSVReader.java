import java.io.*;
import java.util.*;
import org.json.simple.JSONObject;


public class CSVReader {
    Map<String, ArrayList<String>> nodeMap = new HashMap<>();

    public CSVReader(String file) {
        String line;
        String delimiter = ",";

        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            while ((line = br.readLine()) != null) {
                ArrayList<String> node = new ArrayList<>();
                String[] values = line.split(delimiter);

                if (values.length < 6) {
                    System.out.println("Skipping invalid line: " + line);
                    continue;
                }

                String nodeID = values[0].trim();
                for (int i = 0; i < 5; i++) {
                    node.add(values[i].trim());
                }

                for (int i = 5; i < values.length; i++) {
                    node.add(values[i].replaceAll("\"", "").trim());
                }

                nodeMap.put(nodeID, node);
            }

        } catch (IOException e) {
            e.printStackTrace();
        }

        System.out.println("Loaded Nodes: " + nodeMap.keySet());
    }

    public void initiate(String start, List<String> paths) {
        start = start.trim();
        paths.add(start);

        ArrayList<String> dataPoint = nodeMap.get(start);
        if (dataPoint == null) {
            System.out.println("Warning: Node ID " + start + " not found.");
            return;
        }

        for (int i = 5; i < dataPoint.size(); i++) {
            String nextNode = dataPoint.get(i).trim();
            pathGen(nextNode, paths);
        }
    }

    public void pathGen(String start, List<String> paths) {
        if (paths.contains(start)) {
            return;
        }

        start = start.trim();
        ArrayList<String> dataPoint = nodeMap.get(start);

        if (dataPoint == null) {
            System.out.println("Warning: Node ID " + start + " not found.");
            return;
        }

        paths.add(start);

        // Debugging output
        System.out.println("Processing node: " + start);
        System.out.println("Data: " + dataPoint);
        System.out.println("Size: " + dataPoint.size());

        if (dataPoint.get(1).equals("C") || dataPoint.get(1).equals("St")) {
            System.out.println("Final path: " + paths);
        } else {
            for (int i = 5; i < dataPoint.size(); i++) {
                String nextNode = dataPoint.get(i).trim();
                pathGen(nextNode, paths);
            }
        }
    }

    public static void main(String[] args) throws Exception {
        JSONObject obj = new JSONObject();
        String csvFile = "client/Pathfinding/p3.csv";
        CSVReader reader = new CSVReader(csvFile);

        List<String> paths = new ArrayList<>();
        reader.initiate("36", paths);
    }
}
