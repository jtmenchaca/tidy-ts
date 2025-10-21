Object-Centric Event Data
PM4Py provides support for object-centric event logs (importing and exporting).

Motivation
Traditional event logs, commonly used in mainstream process mining techniques, require events to be associated with a specific case. A case represents a set of events related to a particular process or purpose. However, this case-based approach leads to two main problems in real-world processes:

Convergence problem: In the Order-to-Cash process, an order can be linked to many different deliveries. If we treat the delivery as the case, we need to replicate the same "Create Order" event across multiple cases (all deliveries involving that order).
Divergence problem: In the same process, an order could contain different items, each with a unique lifecycle. Treating the entire order as the case results in several instances of the same activity for each item, complicating the frequency and performance annotations for the process.
Object-centric event logs resolve these issues by allowing an event to be associated with multiple objects of different types. The components of an object-centric event log are as follows:

Events: Each event has an identifier, an activity, a timestamp, a list of related objects, and a dictionary of other attributes.
Objects: Each object has an identifier, a type, and a dictionary of attributes.
Attribute names: These represent possible keys for the event/object attribute map.
Object types: These represent possible types for the objects in the log.
Supported Formats
Several historical formats, such as OpenSLEX and XOC, have been proposed for storing object-centric event logs. In particular, the OCEL standard defines lean and intercompatible formats for storing object-centric event logs. These formats include:

XML-OCEL: An XML-based format for object-centric event logs. An example XML-OCEL event log can be found here.
JSON-OCEL: A JSON-based format for object-centric event logs. An example JSON-OCEL event log can be found here.
Both formats use common attributes: the event identifier is ocel:id, the activity identifier is ocel:activity, the timestamp of the event is ocel:timestamp, and the type of the object is ocel:type. Additionally, related objects for the events are identified by ocel:omap, the event's attribute map by ocel:vmap, and the object's attribute map by ocel:ovmap.

Excluding object-level attributes, the object-centric event log can also be represented in CSV format. An example of a CSV-OCEL event log can be found here. Each row in the CSV represents an event, with the event identifier as ocel:eid and related objects for a given type OTYPE listed under ocel:type:OTYPE.

Importing/Exporting OCELs
For all supported formats, an OCEL event log can be read using the following code:

                
import pm4py

if __name__ == "__main__":
    path = "tests/input_data/ocel/example_log.jsonocel"
    ocel = pm4py.read_ocel(path)

            
An OCEL can also be exported easily using the following code (assuming `ocel` is an object-centric event log):

                
import pm4py

if __name__ == "__main__":
    path = "./output.jsonocel"
    pm4py.write_ocel(ocel, path)

            
Basic Statistics on OCELs
PM4Py offers some basic statistics that can be calculated on OCELs. The simplest way to obtain these statistics is by printing the OCEL object itself:

                
if __name__ == "__main__":
    print(ocel)

            
When printed, the statistics for the OCEL object will include details such as the number of events, objects, activities, object types, and relationships. Additionally, occurrences of activities and object types in the log are also reported.

To retrieve the names of the attributes in the log, use the following command:

                
if __name__ == "__main__":
    attribute_names = pm4py.ocel_get_attribute_names(ocel)

            
To retrieve the object types in the log, use the following command:

                
if __name__ == "__main__":
    object_types = pm4py.ocel_get_object_types(ocel)

            
You can also retrieve a dictionary containing the set of activities for each object type using the following command:

                
if __name__ == "__main__":
    object_type_activities = pm4py.ocel_object_type_activities(ocel)

            
To get the number of related objects per event identifier and object type, use the following command:

                
if __name__ == "__main__":
    ocel_objects_ot_count = pm4py.ocel_objects_ot_count(ocel)

            
The temporal summary of an object-centric event log can be calculated to show the set of activities occurring at each timestamp, along with the objects involved at that point in time.

                
if __name__ == "__main__":
    temporal_summary = pm4py.ocel_temporal_summary(ocel)

            
The objects summary provides a table that reports each object along with the list of related activities, the start/end timestamps of the object's lifecycle, the lifecycle's duration, and related objects in the interaction graph.

                
  if __name__ == "__main__":
    objects_summary = pm4py.ocel_objects_summary(ocel)

            
Internal Data Structure
PM4Py stores object-centric event logs using three primary Pandas dataframes:

events: Stores a row for each event, containing the event identifier (ocel:eid), activity (ocel:activity), timestamp (ocel:timestamp), and additional event attributes.
objects: Stores a row for each object, containing the object identifier (ocel:oid), object type (ocel:type), and additional object attributes.
relations: Stores a row for each relationship between an event and an object, containing the event identifier (ocel:eid), object identifier (ocel:oid), and the type of the related object (ocel:type).
These dataframes can be accessed as properties of the OCEL object (e.g., ocel.events, ocel.objects, ocel.relations) and can be used for filtering, discovery, or other purposes.

Filtering Object-Centric Event Logs
In this section, we describe various filtering operations available in PM4Py that are specific to object-centric event logs. Filters are applied at three levels:

Event level filters (operating on the ocel.events structure first, and then propagating the result to other parts of the object-centric log).
Object level filters (operating on the ocel.objects structure first, and then propagating the result to other parts of the object-centric log).
Relations level filters (operating on the ocel.relations structure first, and then propagating the result to other parts of the object-centric log).
Filter on Event Attributes
Events can be filtered based on a specific attribute falling within a predefined list of values using the function pm4py.filter_ocel_event_attribute. For instance, to filter by the ocel:activity (activity) attribute, an example is shown below. The positive boolean indicates whether to include events with activities within the list or exclude them (when positive is set to False).

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_event_attribute(ocel, "ocel:activity", ["Create Fine", "Send Fine"], positive=True)

            
Filter on Object Attributes
Objects can be filtered based on a specific attribute falling within a predefined list of values using the function pm4py.filter_ocel_object_attribute. For example, filtering on the ocel:type (object type) attribute is demonstrated below. The positive boolean indicates whether to include objects of types within the list or exclude them (if positive is set to False).

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_object_attribute(ocel, "ocel:type", ["order", "delivery"], positive=True)

            
Filter on Allowed Activities per Object Type
Sometimes, object-centric event logs contain more relations between events and objects than are legitimate, leading to the divergence problem. To address this, we introduce a filter that limits the allowed activities for each object type. This ensures that for each activity, only the relevant object types are retained, excluding others. An example is shown where for the order object type, only the Create Order activity is kept, and for the item object type, only the Create Order and Create Delivery activities are retained.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_object_types_allowed_activities(ocel, {"order": ["Create Order"], "item": ["Create Order", "Create Delivery"]})

            
Filter on the Number of Objects per Type
This filter allows searching for specific patterns in the log, such as identifying events related to at least one order and two items. It helps identify exceptional patterns, such as an unusually high number of related objects per event. An example of using this filter is shown below.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_object_per_type_count(ocel, {"order": 1, "element": 2})

            
Filter on Start/End Events per Object
In some cases, it may be important to identify events marking the start or completion of an object's lifecycle. This can help detect any incompleteness in the event log records. Examples of using this filter are provided below.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_start_events_per_object_type(ocel, "order")
    filtered_ocel = pm4py.filter_ocel_end_events_per_object_type(ocel, "order")

            
Filter on Event Timestamp
A useful filter to restrict the behavior of the object-centric event log to a specific time interval is the timestamp filter, which works similarly to its traditional counterpart. An example is shown below.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_events_timestamp(ocel, "1981-01-01 00:00:00", "1982-01-01 00:00:00", timestamp_key="ocel:timestamp")

            
Filter on Object Types
This filter allows retaining only a limited set of object types from the log by manually specifying which object types should be kept. Only the events related to at least one object of the specified types will be retained.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_object_types(ocel, ['order', 'element'])

            
Filter on Event Identifiers
This filter allows retaining specific events from the object-centric log by explicitly specifying their identifiers.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_events(ocel, ['e1', 'e2'])

            
Filter on Connected Components
This filter allows retaining only the events related to the connected component of a provided object within the objects' interaction graph. This way, a subset of loosely interconnected events from the original log is preserved.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_cc_object(ocel, 'o1')

            
Filter on Object Identifiers
This filter allows retaining a subset of the objects (by their identifiers) from the original object-centric event log. Only the events related to at least one of these objects will be kept in the log.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_objects(ocel, ['o1', 'i1'])

            
Additionally, the filter can iteratively expand the set of objects to include those that are interconnected with the provided objects in the objects' interaction graph. This can be done by specifying the level parameter. An example of expanding the set of objects to include the 'nearest' objects is provided below.

                
if __name__ == "__main__":
    filtered_ocel = pm4py.filter_ocel_objects(ocel, ['o1'], level=2)

            
Sampling on the Events
It is possible to retain a random subset of the events from the original object-centric event log. However, in this case, interactions between objects may be lost.

    
if __name__ == "__main__":
    filtered_ocel = pm4py.sample_events(ocel, num_events=100)

Flattening to a Traditional Log
Flattening allows the conversion of an object-centric event log into a traditional event log by specifying the object type. This facilitates the application of traditional process mining techniques to the flattened log.

An example where an event log is imported, and a flattening operation is applied to the order object type, is as follows:

    
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    flattened_log = pm4py.ocel_flattening(ocel, "order")

Timestamp-Based Interleavings
It is rare for an object-centric event log to be produced directly during the extraction phase from information systems. Extractors for this scenario are still uncommon. More frequently, event logs are extracted from the system and then related to each other. In such cases, we can use traditional extractors to retrieve the event logs and additionally extract the relationships between the cases. This information can be used to mine the relationships between events. Specifically, the timestamp-based interleaving method can be employed, which considers the temporal flow between different processes based on the provided case relations: one can move from the left process to the right process and vice versa.

In the following example, we assume the cases are represented as Pandas dataframes (using the classical PM4Py naming conventions, e.g., case:concept:name, concept:name, and time:timestamp). A dataframe containing the case relations is defined between them, with related cases expressed as case:concept:name_LEFT and case:concept:name_RIGHT. Here, we load two event logs and a dataframe containing the relationships between them, then apply the timestamp-based interleaved miner.

    
import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe1 = pd.read_csv("tests/input_data/interleavings/receipt_even.csv")
    dataframe1 = pm4py.format_dataframe(dataframe1)
    dataframe2 = pd.read_csv("tests/input_data/interleavings/receipt_odd.csv")
    dataframe2 = pm4py.format_dataframe(dataframe2)
    case_relations = pd.read_csv("tests/input_data/interleavings/case_relations.csv")

    from pm4py.algo.discovery.ocel.interleavings import algorithm as interleavings_discovery
    interleavings = interleavings_discovery.apply(dataframe1, dataframe2, case_relations)

The resulting interleavings dataframe will contain several columns, each corresponding to a pair of related events (one from the first dataframe and the other from the second):

All the columns of the event (or interleaving) from the first dataframe (prefixed with LEFT).
All the columns of the event (or interleaving) from the second dataframe (prefixed with RIGHT).
The column @@direction indicating the direction of the interleaving (LR for left-to-right, meaning from the first dataframe to the second; RL for right-to-left, meaning from the second dataframe to the first).
The columns @@source_activity and @@target_activity contain the source and target activities of the interleaving, respectively.
The columns @@source_timestamp and @@target_timestamp contain the source and target timestamps of the interleaving, respectively.
The column @@left_index contains the index of the event in the first dataframe.
The column @@right_index contains the index of the event in the second dataframe.
The column @@timestamp_diff contains the difference between the two timestamps (useful for aggregating by time).
We also provide a visualization of the interleavings between the two logs, taking into account their DFGs and showing the interleavings between them, decorated by the frequency or performance of the relationships. Below is an example of frequency-based interleavings visualization:

    
import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe1 = pd.read_csv("tests/input_data/interleavings/receipt_even.csv")
    dataframe1 = pm4py.format_dataframe(dataframe1)
    dataframe2 = pd.read_csv("tests/input_data/interleavings/receipt_odd.csv")
    dataframe2 = pm4py.format_dataframe(dataframe2)
    case_relations = pd.read_csv("tests/input_data/interleavings/case_relations.csv")

    from pm4py.algo.discovery.ocel.interleavings import algorithm as interleavings_discovery
    interleavings = interleavings_discovery.apply(dataframe1, dataframe2, case_relations)

    from pm4py.visualization.ocel.interleavings import visualizer as interleavings_visualizer

    # Visualizes the frequency of the interleavings
    gviz_freq = interleavings_visualizer.apply(dataframe1, dataframe2, interleavings, parameters={"annotation": "frequency", "format": "svg"})
    interleavings_visualizer.view(gviz_freq)

Additionally, here is an example of performance-based interleavings visualization:

    
import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe1 = pd.read_csv("tests/input_data/interleavings/receipt_even.csv")
    dataframe1 = pm4py.format_dataframe(dataframe1)
    dataframe2 = pd.read_csv("tests/input_data/interleavings/receipt_odd.csv")
    dataframe2 = pm4py.format_dataframe(dataframe2)
    case_relations = pd.read_csv("tests/input_data/interleavings/case_relations.csv")

    from pm4py.algo.discovery.ocel.interleavings import algorithm as interleavings_discovery
    interleavings = interleavings_discovery.apply(dataframe1, dataframe2, case_relations)

    from pm4py.visualization.ocel.interleavings import visualizer as interleavings_visualizer

    # Visualizes the performance of the interleavings
    gviz_perf = interleavings_visualizer.apply(dataframe1, dataframe2, interleavings, parameters={"annotation": "performance", "aggregation_measure": "median", "format": "svg"})
    interleavings_visualizer.view(gviz_perf)

The following parameters are available for the interleavings visualization:

Parameters.FORMAT: The format of the visualization (svg, png).
Parameters.BGCOLOR: The background color of the visualization (default: transparent).
Parameters.RANKDIR: The direction of the diagram visualization (LR, TB).
Parameters.ANNOTATION: The type of annotation to be used (frequency, performance).
Parameters.AGGREGATION_MEASURE: The aggregation method to be used (mean, median, min, max).
Parameters.ACTIVITY_PERCENTAGE: The percentage of activities to be included in the DFGs and interleavings visualization.
Parameters.PATHS_PERCENTAGE: The percentage of paths to be included in the DFGs and interleavings visualization.
Parameters.DEPENDENCY_THRESHOLD: The threshold to filter the edges of the DFG.
Parameters.MIN_FACT_EDGES_INTERLEAVINGS: The fraction of interleavings to be shown in the diagram.
Creating an OCEL from the Interleavings
Given two logs with related cases, we have seen how to calculate the interleavings between the logs. In this section, we will leverage the information contained in the two logs and their interleavings to create an object-centric event log (OCEL). This OCEL will contain the events from both event logs and the connections between them, and it can be used with any object-centric process mining technique. Below is an example:

    
import pandas as pd
import pm4py

if __name__ == "__main__":
    dataframe1 = pd.read_csv("tests/input_data/interleavings/receipt_even.csv")
    dataframe1 = pm4py.format_dataframe(dataframe1)
    dataframe2 = pd.read_csv("tests/input_data/interleavings/receipt_odd.csv")
    dataframe2 = pm4py.format_dataframe(dataframe2)
    case_relations = pd.read_csv("tests/input_data/interleavings/case_relations.csv")

    from pm4py.algo.discovery.ocel.interleavings import algorithm as interleavings_discovery
    interleavings = interleavings_discovery.apply(dataframe1, dataframe2, case_relations)

    from pm4py.objects.ocel.util import log_ocel
    ocel = log_ocel.from_interleavings(dataframe1, dataframe2, interleavings)

Merging Related Logs (Case Relations)
When considering two interrelated event logs, it may make sense to merge them for certain analyses. The resulting log will contain cases that include events from both the first and second event logs. This is common in enterprise processes such as P2P and O2C. For example, when a sales order is placed that requires a material not currently available, a purchase order may be created to acquire the material and fulfill the sales order.

For the merge operation, we need to consider the following:

A reference event log (whose cases will be enriched by the events from the other event log).
An event log to be merged (whose events will be included in the cases of the reference event log).
A set of case relationships between the logs.
Below is an example: The result is a traditional event log.

    
import pandas as pd
import pm4py
from pm4py.algo.merging.case_relations import algorithm as case_relations_merging
import os

if __name__ == "__main__":
    dataframe1 = pd.read_csv(os.path.join("tests", "input_data", "interleavings", "receipt_even.csv"))
    dataframe1 = pm4py.format_dataframe(dataframe1)
    dataframe2 = pd.read_csv(os.path.join("tests", "input_data", "interleavings", "receipt_odd.csv"))
    dataframe2 = pm4py.format_dataframe(dataframe2)
    case_relations = pd.read_csv(os.path.join("tests", "input_data", "interleavings", "case_relations.csv"))
    merged = case_relations_merging.apply(dataframe1, dataframe2, case_relations)

Network Analysis
Classical social network analysis methods (such as those described later on this page) are based on the order of events within a case. For example, the "Handover of Work" metric considers directly-following relationships between resources during the execution of a case. An edge is added between two resources if such relationships occur.

Real-world scenarios are often more complex. First, it can be difficult to collect events within the same case without encountering convergence/divergence issues (see the first section of the OCEL part). Second, the type of relationship may also be important. For example, a relationship between two resources may be more efficient if the activity being executed is liked by the resources rather than disliked.

The network analysis introduced in this section generalizes some existing social network analysis metrics by becoming independent of the case notion and enabling the construction of a multi-graph instead of a simple graph. Here, events are linked by signals. Each event emits a signal (as an attribute), which is assumed to be received by other events (also an attribute) that follow the first event in the log. Thus, the OUT attribute of the event is identical to the IN attribute of the subsequent events.

Once this information is collected, we can construct the network analysis graph:

The source node of the relation is defined by an aggregation over a node_column_source attribute.
The target node of the relation is defined by an aggregation over a node_column_target attribute.
The edge type is defined by an aggregation over an edge_column attribute.
The network analysis graph can be annotated with either frequency or performance information.
Below is an example of network analysis that produces a multigraph annotated with frequency information and visualizes it:

    
import os
import pm4py

if __name__ == "__main__":
    log = pm4py.read_xes(os.path.join("tests", "input_data", "receipt.xes"))

    frequency_edges = pm4py.discover_network_analysis(log, out_column="case:concept:name", in_column="case:concept:name", node_column_source="org:group", node_column_target="org:group", edge_column="concept:name", performance=False)
    pm4py.view_network_analysis(frequency_edges, variant="frequency", format="svg", edge_threshold=10)

In the previous example, we loaded a traditional event log (receipt.xes) and performed the network analysis using the following parameters:

The OUT column is set to case:concept:name and the IN column is also set to case:concept:name (meaning that succeeding events from the same case are connected).
The node_column_source and node_column_target attributes are set to org:group (indicating the network of relations between different organizational groups).
The edge_column attribute is set to concept:name (indicating the frequency or performance of edges between groups based on activity, which helps evaluate advantageous exchanges).
Note that in the previous case, we used the case identifier as the OUT/IN column, but this is just a specific example. The OUT and IN columns can be different and need not necessarily correspond to the case identifier.

Here is an example of network analysis producing a multigraph annotated with performance information and visualizing the same:

    
import os
import pm4py

if __name__ == "__main__":
    log = pm4py.read_xes(os.path.join("tests", "input_data", "receipt.xes"))

    performance_edges = pm4py.discover_network_analysis(log, out_column="case:concept:name", in_column="case:concept:name", node_column_source="org:group", node_column_target="org:group", edge_column="concept:name", performance=True)
    pm4py.view_network_analysis(performance_edges, variant="performance", format="svg", edge_threshold=10)

The visualization supports the following parameters:

format: The format of the visualization (default: png).
bgcolor: The background color of the visualization.
activity_threshold: The minimum number of occurrences for an activity to be included (default: 1). Only activities with a frequency ≥ this threshold will appear in the graph.
edge_threshold: The minimum number of occurrences for an edge to be included (default: 1).
Link Analysis
While the goal of network analysis is to provide an aggregated visualization of the links between different events, the goal of link analysis is to discover the links between events and reason about them.

In the following examples, we consider the document flow table VBFA of SAP. This table contains properties and connections between sales order documents (e.g., the order document itself, delivery documents, and invoice documents). Reasoning about the properties of these links can help identify anomalous situations (e.g., if the currency or price is changed during the order's lifecycle).

A link analysis begins by producing a link analysis dataframe. This dataframe contains the linked events according to the provided attribute specifications. First, we load a CSV containing information from the VBFA table, extracted from an educational instance of SAP. Then, we perform preprocessing to ensure the consistency of the data in the dataframe. Finally, we discover the link analysis dataframe.

                
import pandas as pd
from pm4py.algo.discovery.ocel.link_analysis import algorithm as link_analysis
import os

if __name__ == "__main__":
    dataframe = pd.read_csv(os.path.join("tests", "input_data", "ocel", "VBFA.zip"), compression="zip", dtype="str")
    dataframe["time:timestamp"] = dataframe["ERDAT"] + " " + dataframe["ERZET"]
    dataframe["time:timestamp"] = pd.to_datetime(dataframe["time:timestamp"], format="%Y%m%d %H%M%S")
    dataframe["RFWRT"] = dataframe["RFWRT"].astype(float)
    dataframe = link_analysis.apply(dataframe, parameters={"out_column": "VBELN", "in_column": "VBELV",
                                                           "sorting_column": "time:timestamp", "propagate": True})

            
At this point, several analyses can be performed. For example, the interconnected documents where the currency differs between the two documents can be found as follows:

                
if __name__ == "__main__":
    df_currency = dataframe[(dataframe["WAERS_out"] != " ") & (dataframe["WAERS_in"] != " ") & (
                dataframe["WAERS_out"] != dataframe["WAERS_in"])]
    print(df_currency[["WAERS_out", "WAERS_in"]].value_counts())

            
It is also possible to evaluate the amounts of the documents to identify discrepancies.

                
if __name__ == "__main__":
    df_amount = dataframe[(dataframe["RFWRT_out"] > 0) & (dataframe["RFWRT_out"] < dataframe["RFWRT_in"])]
    print(df_amount[["RFWRT_out", "RFWRT_in"]])

            
The parameters for the link analysis algorithm are as follows:

Parameters.OUT_COLUMN: The column of the dataframe used to link the source events to the target events.
Parameters.IN_COLUMN: The column of the dataframe used to link the target events to the source events.
Parameters.SORTING_COLUMN: The attribute used to sort the dataframe.
Parameters.INDEX_COLUMN: The name of the column in the dataframe used to store the incremental event index.
Parameters.LOOK_FORWARD: Merge event e1 with event e2 (e1.OUT = e2.IN) only if the index of e1 in the dataframe is lower than that of e2.
Parameters.KEEP_FIRST_OCCURRENCE: If several events e21, e22 are such that e1.OUT = e21.IN = e22.IN, keep only the relationship between e1 and e21.
Parameters.PROPAGATE: Propagate discovered relationships. For example, if e1.OUT = e2.IN and e2.OUT = e3.IN, consider e1 to also have a relationship with e3.
OC-DFG Discovery
Object-centric directly-follows multigraphs (OC-DFGs) are compositions of directly-follows graphs for single object types. These graphs can be annotated with various metrics, considering the entities of an object-centric event log (e.g., events, unique objects, total objects). We offer both the discovery of OC-DFGs (which provide generic objects, allowing for a variety of metric choices) and their visualization. An example in which an object-centric event log is loaded, an OC-DFG is discovered, and visualized with frequency annotation is shown on the right.

                
import pm4py
import os

if __name__ == "__main__":
    ocel = pm4py.read_ocel(os.path.join("tests", "input_data", "ocel", "example_log.jsonocel"))
    ocdfg = pm4py.discover_ocdfg(ocel)
    # View the model with the frequency annotation
    pm4py.view_ocdfg(ocdfg, format="svg")

            
An example in which an object-centric event log is loaded, an OC-DFG is discovered, and visualized with performance annotation is shown on the right.

                
import pm4py
import os

if __name__ == "__main__":
    ocel = pm4py.read_ocel(os.path.join("tests", "input_data", "ocel", "example_log.jsonocel"))
    ocdfg = pm4py.discover_ocdfg(ocel)
    # View the model with the performance annotation
    pm4py.view_ocdfg(ocdfg, format="svg", annotation="performance", performance_aggregation="median")

            
The visualization supports the following parameters:

annotation: The annotation to use for the visualization. Possible values: frequency (frequency annotation), performance (performance annotation).
act_metric: The metric to use for activities. Available values: events (number of events), unique_objects (number of unique objects), total_objects (number of total objects).
edge_metric: The metric to use for edges. Available values: event_couples (number of event couples), unique_objects (number of unique objects), total_objects (number of total objects).
act_threshold: The threshold to apply on activity frequency (default: 0). Only activities with a frequency ≥ this threshold will be included in the graph.
edge_threshold: The threshold to apply on edge frequency (default: 0). Only edges with a frequency ≥ this threshold will be included in the graph.
performance_aggregation: The aggregation measure to use for performance: mean, median, min, max, sum.
format: The format for the output visualization (default: png).
OC-PN Discovery
Object-centric Petri nets (OC-PNs) are formal models discovered on top of object-centric event logs using an underlying process discovery algorithm (e.g., the Inductive Miner). They have been described in the scientific paper:

van der Aalst, Wil MP, and Alessandro Berti. "Discovering object-centric Petri nets." Fundamenta Informaticae 175.1-4 (2020): 1-40.

In PM4Py, we offer a basic implementation of object-centric Petri nets (without additional decoration). An example where an object-centric event log is loaded, the discovery algorithm is applied, and the OC-PN is visualized is shown on the right.

                
import pm4py
import os

if __name__ == "__main__":
    ocel = pm4py.read_ocel(os.path.join("tests", "input_data", "ocel", "example_log.jsonocel"))
    model = pm4py.discover_oc_petri_net(ocel)
    pm4py.view_ocpn(model, format="svg")

            
Object Graphs on OCELs
It is possible to capture the interactions between different objects of an OCEL in various ways. In PM4Py, we provide support for the computation of object-based graphs:

The objects interaction graph connects two objects if they are related in some event of the log.
The objects descendants graph connects an object, which is related to an event but does not start its lifecycle with the event, to all the objects that start their lifecycle with that event.
The objects inheritance graph connects an object, which terminates its lifecycle with a given event, to all the objects that start their lifecycle with that event.
The objects cobirth graph connects objects that start their lifecycle within the same event.
The objects codeath graph connects objects that complete their lifecycle within the same event.
The object interactions graph can be computed as follows:

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.graphs import object_interaction_graph
    graph = object_interaction_graph.apply(ocel)

            
The object descendants graph can be computed as follows:

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.graphs import object_descendants_graph
    graph = object_descendants_graph.apply(ocel)

            
The object inheritance graph can be computed as follows:

                
import pm4py

    if __name__ == "__main__":
        ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
        from pm4py.algo.transformation.ocel.graphs import object_inheritance_graph
        graph = object_inheritance_graph.apply(ocel)

            
The object cobirth graph can be computed as follows:

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.graphs import object_cobirth_graph
    graph = object_cobirth_graph.apply(ocel)

            
The object codeath graph can be computed as follows:

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.graphs import object_codeath_graph
    graph = object_codeath_graph.apply(ocel)

            
Feature Extraction on OCEL - Object-based
For machine learning purposes, we may want to create a feature matrix that contains a row for each object in the object-centric event log. The dimensions considered for feature computation may include:

The lifecycle of an object (the sequence of events related to that object). From this, features such as the length and duration of the lifecycle can be computed. Additionally, the sequence of activities within the lifecycle can be derived (e.g., one-hot encoding of activities).
Features derived from object-based graphs (e.g., objects interaction graph, objects descendants graph, objects inheritance graph, and objects cobirth/codeath graph). For each graph, the number of objects connected to a given object is considered as a feature.
The number of objects whose lifecycle intersects (in terms of time) with the current object.
The one-hot encoding of a specified collection of string attributes.
The encoding of values from a specified collection of numeric attributes.
To compute the object-based features, the following command can be used (we consider oattr1 as the only string attribute to one-hot encode and oattr2 as the only numeric attribute to encode). If no string/numeric attributes should be included, the respective parameters can be omitted.

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.features.objects import algorithm
    data, feature_names = algorithm.apply(ocel,
                                          parameters={"str_obj_attr": ["oattr1"], "num_obj_attr": ["oattr2"]})

            
Feature Extraction on OCEL - Event-based
For machine learning purposes, we may want to create a feature matrix containing a row for every event in the object-centric event log. The dimensions considered for feature computation may include:

The timestamp of the event, encoded in various ways (absolute timestamp, hour of the day, day of the week, month).
The activity of the event. A one-hot encoding of activity values can be performed.
The related objects of the event. Features such as the total number of related objects, number of related objects per type, the number of objects starting their lifecycle with the event, and the number of objects completing their lifecycle with the event can be considered.
The one-hot encoding of a specified collection of string attributes.
The encoding of values from a specified collection of numeric attributes.
To compute the event-based features, the following command can be used (we consider prova as the only string attribute to one-hot encode and prova2 as the only numeric attribute to encode). If no string/numeric attributes should be included, the parameters can be omitted.

                
import pm4py

if __name__ == "__main__":
    ocel = pm4py.read_ocel("tests/input_data/ocel/example_log.jsonocel")
    from pm4py.algo.transformation.ocel.features.events import algorithm
    data, feature_names = algorithm.apply(ocel,
                                          parameters={"str_obj_attr": ["prova"], "num_obj_attr": ["prova2"]})

            
OCEL Validation
The validation process allows for checking the validity of JSON-OCEL/XML-OCEL files before parsing them. This is done against a schema containing the basic structure that these files should follow.

To validate a JSON-OCEL file, the following command can be used:

                
from pm4py.objects.ocel.validation import jsonocel

if __name__ == "__main__":
    validation_result = jsonocel.apply("tests/input_data/ocel/example_log.jsonocel", "tests/input_data/ocel/schema.json")
    print(validation_result)

            
To validate an XML-OCEL file, the following command can be used:

                
from pm4py.objects.ocel.validation import xmlocel

if __name__ == "__main__":
    validation_result = xmlocel.apply("tests/input_data/ocel/example_log.xmlocel", "tests/input_data/ocel/schema.xml")
    print(validation_result)

            