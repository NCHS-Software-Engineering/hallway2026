import java.io.File;
import java.io.IOException;
import java.util.Scanner;

public class CSVReaderScanner {
    public static void main(String[] args) {
        String csvFile = "/Users/yutian/Desktop/APCS/Hallway-Nav/client/Pathfinding/p3.csv";
        String delimiter = ",";

        try (Scanner scanner = new Scanner(new File(csvFile))) {
            while (scanner.hasNextLine()) {
                String line = scanner.nextLine();
                Scanner lineScanner = new Scanner(line);
                lineScanner.useDelimiter(delimiter);
                while (lineScanner.hasNext()) {
                    String value = lineScanner.next();
                    System.out.print(value + " ");
                }
                System.out.println();
                lineScanner.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
