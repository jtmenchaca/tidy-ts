# Object-Centric Process Mining: Emergency Department Analysis

## Analytical Comparison: Traditional vs. Object-Centric Approaches

| I want to know... | Traditional Rating | Traditional Case-Based Approach | OCPM Rating | Object-Centric Process Mining |
|-------------------|-------------------|--------------------------------|-------------|-------------------------------|
| **How long does a patient stay in the ED?** | ✅ | Calculate duration from first to last event per patient case. Straightforward timeline analysis. | ✅ | Same calculation possible. Patient object lifecycle shows identical duration metrics. |
| **What is the typical patient journey?** | ✅ | Direct visualization of patient process variants. Clear patient-centric process map. | 👌 | Requires flattening to patient perspective. More complex visualization includes all object types. |
| **Which doctor treated which patient?** | ❌ | Requires data enrichment or separate resource log. Standard event logs don't capture this relationship. | ✅ | Native capability. Relations table directly shows doctor-patient event participation. |
| **Are doctors equally utilized?** | 👌 | Can count events per resource if resource is an event attribute. Shows activity frequency. | ✅ | Shows both event counts AND patient coverage. Reveals d1 treated 2 patients vs d2 treated 1 patient. |
| **Why did some patients get X-rays and others get blood tests?** | 👌 | Appears as process variants. Difficult to determine if driven by clinical need or resource availability. | ✅ | Can correlate decision points with available resources. Shows temporal overlap of competing patient demands. |
| **How much time do patients spend waiting vs. receiving care?** | 👌 | Calculate gaps between consecutive events in patient case. Assumes waiting is any gap in patient timeline. | ✅ | Can distinguish waiting for resources (doctor/nurse unavailable) from waiting for results (lab processing time). |
| **What activities require multiple staff members?** | 👌 | Infer from resource attributes if available. Not structurally represented in standard logs. | ✅ | Explicit in event-object relations. Activities with multiple object types are immediately visible. |
| **Is nurse workload balanced?** | 👌 | Requires resource-centric analysis separate from case-based analysis. Not native to traditional approach. | ✅ | Direct calculation from relations. Shows n1 involved in 4 events, n2 in 3 events across all patients. |
| **What does the "nurse role" do in the ED process?** | 👌 | Aggregate all events where resource type = nurse. Treats all nurses as interchangeable. | ✅ | Can toggle between individual nurse analysis and role-level (recoded) analysis. Flexible perspective. |
| **Are there bottlenecks in the process?** | 👌 | Identify activities with long waiting times in patient cases. Resource perspective requires separate analysis. | ✅ | Shows both activity bottlenecks AND resource bottlenecks. Can identify when specific doctors/nurses cause delays. |
| **What is the sequence of work for a specific doctor?** | ❌ | Requires inverting the log structure or separate resource-centric mining. Non-standard analysis. | ✅ | Natural query: filter relations by doctor ID, order by timestamp. Direct object lifecycle analysis. |
| **How many patients can we handle with current staffing?** | ❌ | Count concurrent cases. Assumes resources are always available. Cannot model resource constraints. | ✅ | Model concurrent patient flows AND resource availability. Shows actual capacity based on staff synchronization needs. |
| **If I add another nurse, where should they focus?** | 👌 | Identify high-frequency activities involving nurses. Activity-level recommendation only. | ✅ | Shows which nurses handle which patient types and at what process stages. Reveals gaps in coverage vs. duplication. |
| **Why are discharge times increasing?** | 👌 | Analyze time from last clinical activity to discharge per case. Shows patient-side delays. | ✅ | Shows if delays are due to nurse unavailability, missing handoffs between staff, or patient-side factors. |
| **Do patients with tests ordered wait longer?** | 👌 | Compare patient journey durations by variant (with/without tests). Shows correlation. | ✅ | Shows if longer waits are due to test processing time OR because doctors ordering tests are overloaded. Separates causes. |
| **Which staff members frequently work together?** | ❌ | Not addressable without custom data enrichment. Requires manual log reconstruction. | ✅ | Direct analysis of events with multiple staff objects. Shows collaboration patterns and handoff frequencies. |
| **What percentage of patients bypass triage?** | ✅ | Count cases missing triage activity. Shows compliance deviation. | ✅ | Shows if bypasses correlate with nurse availability or specific patient arrival patterns. Contextualizes exceptions. |
| **Are we meeting target times for critical activities?** | 👌 | Measure activity durations in patient cases. Shows performance against targets. | ✅ | Distinguishes between activity execution time and resource queuing time. Shows if targets fail due to slow execution or resource unavailability. |
| **How does patient volume affect staff productivity?** | 👌 | Compare case volumes to case durations. Indirect measure of staff load. | ✅ | Directly measure events per staff member over time. Shows how individual productivity changes with concurrent patient load. |
| **What happens when a doctor is absent?** | 👌 | Rerun analysis excluding cases on absence dates. Shows impact on patient flow. | ✅ | Shows how remaining doctors absorb patient load, which activities are delayed, and which patients are affected. |
| **Do certain doctor-nurse pairs work more efficiently?** | ❌ | Not addressable. Requires joining separate resource analyses. | ✅ | Track events involving specific doctor-nurse combinations. Measure durations and outcomes for paired work. |
| **Are patients waiting for staff or are staff waiting for patients?** | ❌ | Cannot distinguish. Gaps in patient timeline appear as patient waiting time. | ✅ | Shows when events are delayed due to missing object types (staff unavailable) vs. patient-side dependencies (test results). |
| **What is our actual throughput capacity?** | ❌ | Count patients per hour. Assumes unlimited resources. | ✅ | Calculate based on resource constraints and synchronization requirements. Shows realistic capacity given staffing levels. |
| **Which patients require the most staff coordination?** | 👌 | Identify complex process variants with many activities. Indirect proxy for coordination needs. | ✅ | Count distinct staff objects per patient. Directly shows patients requiring multiple staff members. |
| **How often do handoffs occur between staff?** | ❌ | Not measurable. Handoffs are implicit between activities. | ✅ | Count sequential events where different staff objects participate. Explicit handoff measurement. |
| **Are certain times of day more resource-constrained?** | 👌 | Analyze patient arrival patterns and case durations by time. Shows demand fluctuation. | ✅ | Shows demand AND resource availability by time. Reveals when staff shortages cause delays vs. high patient volume alone. |
| **What activities can run in parallel vs. must be sequential?** | 👌 | Infer from process model structure. Limited to patient perspective. | ✅ | Shows actual parallelism across all object types. Reveals which activities share resources and cannot truly parallelize. |
| **If we streamline registration, will it reduce total wait time?** | 👌 | Simulate faster registration in patient cases. Shows patient-level impact. | ✅ | Shows if registration is a bottleneck for patients OR staff. May reveal that speeding it up just creates downstream queuing. |
| **Which process deviations are due to emergency cases vs. inefficiency?** | 👌 | Label variants as compliant/non-compliant. Cannot distinguish causes without external data. | ✅ | Correlate deviations with resource availability patterns. Emergency cases often show atypical staff combinations or timing. |
| **Do we have the right ratio of doctors to nurses?** | 👌 | Count staff by type. Compare to industry benchmarks. Ratio-based analysis. | ✅ | Analyze event coverage: which patient activities lack necessary staff? Shows functional ratio needs based on actual workflow. |
| **How much rework occurs in the process?** | 👌 | Identify repeated activities in patient cases. Shows loops in patient journey. | ✅ | Distinguishes patient-caused rework (repeat tests) from staff-caused rework (different doctors re-examining same patient). |
| **What is the cost per patient by resource utilization?** | 👌 | Multiply activity costs by frequencies. Assumes fixed resource costs per activity. | ✅ | Allocate actual staff time to patients. Shows cost variations when same activity involves different staff or durations. |
| **Can we predict staffing needs for next week?** | 👌 | Forecast patient volume based on historical arrivals. Assumes current resource ratios. | ✅ | Model required staff by patient type and arrival pattern. Accounts for activity synchronization needs. |
| **Which patients left without being seen?** | ✅ | Identify cases with arrival but no subsequent activities. Shows incomplete cases. | ✅ | Shows which staff patients did/didn't interact with before leaving. Reveals if specific bottlenecks (e.g., triage queue) drive departures. |
| **How does training a new staff member affect throughput?** | ❌ | Not addressable. Training impact is external to case log. | ✅ | Track events involving new staff member over time. Shows learning curve, activities they handle, and impact on other staff workload. |
| **Are we compliant with staffing regulations?** | 👌 | Count staff per shift. Compare to regulatory minimums. Static compliance check. | ✅ | Show actual patient-to-staff ratios at event level. Reveals moments of non-compliance even if shift totals appear adequate. |
| **What percentage of time are staff idle vs. active?** | ❌ | Not directly measurable from patient-centric logs. Requires separate time tracking. | ✅ | Calculate gaps between events in staff object lifecycles. Shows idle time between patient interactions. |
| **Which staff member should I assign to which patient type?** | 👌 | Analyze outcomes by activity and patient type. General activity-level recommendations. | ✅ | Track which staff members handle which patient types most efficiently. Shows individual strengths and preferences. |
| **How does equipment availability affect patient flow?** | ❌ | Not addressable. Equipment is not typically a case attribute. | ✅ | Add equipment as object type. Shows when equipment sharing creates bottlenecks across patients. |
| **What is the average nurse-to-patient contact time?** | ❌ | Cannot measure. Events are patient-centric, not interaction-centric. | ✅ | Sum event durations where both nurse and patient objects participate. Direct contact time measurement. |
| **Are referrals being followed up appropriately?** | 👌 | Track referral activity in patient cases. Shows if referral was written. | ✅ | Track if same doctor writes referral and follows up, or if handoff occurs. Shows continuity of care. |
| **Which activities have the highest variation in duration?** | 👌 | Calculate standard deviation of activity durations across cases. | ✅ | Separate variation due to patient complexity from variation due to different staff performing activity. |
| **Do we need more exam rooms?** | ❌ | Not directly addressable. Rooms not captured in standard logs. | ✅ | Add exam rooms as object type. Shows room utilization, turnover time, and patient queuing due to room unavailability. |
| **How often do patients see multiple doctors?** | 👌 | Count distinct doctor attributes per patient case if available. | ✅ | Direct query: patients with relations to multiple doctor objects. Shows consultation patterns. |
| **What is the handoff rate between shifts?** | ❌ | Not measurable without shift information and complex event correlation. | ✅ | Filter events by shift boundaries. Count patients with different staff objects before/after shift change. |
| **Are high-acuity patients getting priority?** | 👌 | Compare wait times by patient acuity level. Shows if priority is given. | ✅ | Shows if high-acuity patients get immediate staff assignment vs. waiting in queue. Reveals prioritization mechanism effectiveness. |
| **Which process steps can be delegated from doctors to nurses?** | 👌 | Identify activities currently performed by doctors. Activity-level analysis. | ✅ | Shows which doctor activities involve minimal patient interaction or could be nurse-led based on actual execution patterns. |
| **How does patient arrival pattern affect staff breaks?** | ❌ | Not addressable. Break times are external to case logs. | ✅ | Model staff availability including breaks. Shows when breaks create coverage gaps given arrival patterns. |
| **Are we using specialists appropriately?** | 👌 | Count specialist consultations. Shows utilization. | ✅ | Shows which patient types see specialists, at what stage, and if specialist time is used efficiently vs. waiting. |
| **What is our first-contact resolution rate?** | ✅ | Count cases with single visit vs. return visits. | ✅ | Shows if returns involve same staff (follow-up) or different staff (handoff failure or incomplete initial treatment). |
| **How long does it take for lab results to return?** | 👌 | Calculate time between test order and result availability in patient timeline. | ✅ | Distinguish lab processing time from time until results are reviewed by doctor. Shows if delays are lab-side or doctor availability. |
| **Which patient pathways are most resource-intensive?** | 👌 | Sum activity durations by process variant. | ✅ | Sum staff time allocated by patient pathway. Shows true resource cost including staff synchronization overhead. |
| **Can we reduce overlap between staff roles?** | ❌ | Not directly measurable. Requires external role definitions. | ✅ | Identify events where multiple staff types perform similar activities. Shows potential role consolidation opportunities. |
| **How many patients are in the ED at peak times?** | ✅ | Count overlapping patient cases by timestamp. | ✅ | Count overlapping patient cases AND show if sufficient staff are available for concurrent load. |
| **What is the most common reason for treatment delays?** | 👌 | Analyze gaps in patient timelines. Attributes delays to patient waiting. | ✅ | Categorize delays by missing object types: staff unavailable, equipment busy, results pending, or patient-side factors. |
| **Are we documenting care appropriately?** | ❌ | Not addressable. Documentation is separate from process execution. | 👌 | If documentation is logged as events, shows time between care delivery and documentation, and which staff document vs. which deliver care. |
| **Which patients require the longest total staff time?** | 👌 | Sum activity durations per patient case. Assumes activities are independent. | ✅ | Sum all staff event durations per patient. Accounts for overlapping staff time when multiple staff work simultaneously. |
| **How often do we escalate cases to senior staff?** | 👌 | Track handoffs from junior to senior staff if logged. Activity sequence analysis. | ✅ | Show explicit escalation patterns: when junior staff hand off to senior, and at what process stage escalation typically occurs. |
| **Are we over-testing or under-testing patients?** | 👌 | Compare test frequencies by patient type to clinical guidelines. Compliance check. | ✅ | Show if tests are ordered when appropriate specialists are unavailable, suggesting defensive medicine vs. clinical need. |
| **What is the optimal patient-to-nurse ratio in real-time?** | 👌 | Use fixed ratios based on regulations or benchmarks. | ✅ | Calculate actual ratios at each moment based on active patient events requiring nurse participation. Shows dynamic needs. |
| **How does shift change affect patient handoffs?** | 👌 | Identify cases spanning shift boundaries. Count of affected cases. | ✅ | Show which patients are mid-treatment during shift change, which staff hand off to whom, and handoff quality (gaps in care). |
| **Are critical medications being administered on time?** | 👌 | Track medication administration events against target times. Timeliness metric. | ✅ | Show if delays are due to medication preparation time, nurse availability, or patient unavailability. Separates causes. |
| **Which patients consume the most resources relative to outcomes?** | 👌 | Calculate resource usage per patient. Requires external outcome data. | ✅ | Allocate staff time and resources per patient. Cross-reference with outcomes to identify inefficient care patterns. |
| **Do we have geographic bottlenecks in the ED?** | ❌ | Not addressable without location data. | ✅ | Add ED zones/bays as object types. Shows if patients queue for specific areas vs. staff availability. |
| **How effective are our triage decisions?** | 👌 | Compare triage severity to actual treatment intensity. Outcome-based validation. | ✅ | Show if high-triage patients get immediate staff assignment or if severity doesn't correlate with resource allocation speed. |
| **What is the cost of treatment delays?** | 👌 | Estimate based on extended case durations. Indirect calculation. | ✅ | Calculate staff overtime, bed utilization, and opportunity cost based on actual resource allocation during delays. |
| **Are we meeting hand hygiene compliance timing?** | ❌ | Not typically logged. Requires separate compliance monitoring. | 👌 | If logged as events, shows time between patient contacts and hygiene events, compliance by staff member and situation. |
| **Which activities have unnecessary waiting built in?** | 👌 | Identify long inter-activity gaps. Assumes all gaps are waiting. | ✅ | Distinguish gaps due to resource unavailability vs. process design (intentional waiting for test results, observation periods). |
| **How does patient complexity affect team composition?** | 👌 | Categorize patients by complexity. Compare activity patterns. | ✅ | Show which patient types require multi-disciplinary teams vs. single-staff care. Reveals team formation patterns. |
| **Are we utilizing mid-level providers effectively?** | 👌 | Count activities by provider type. Utilization rate. | ✅ | Show if mid-level providers handle appropriate patient complexity, or if they're under/over-utilized relative to physicians. |
| **What is the actual bed turnover time?** | 👌 | Calculate time between patient discharge and next admission for bed. | ✅ | Show cleaning time, administrative delays, and staff availability for intake. Separates turnover components. |
| **How often do patients receive conflicting care plans?** | ❌ | Not directly measurable. Requires care plan content analysis. | 👌 | Track when multiple doctors interact with same patient without coordination events. Proxy for potential conflicts. |
| **Which quality metrics correlate with staffing levels?** | 👌 | Correlate patient outcomes with shift staffing counts. Aggregate analysis. | ✅ | Show patient-level outcomes correlated with specific staff assignments, workload, and concurrent patient load at treatment time. |
| **Are we batch-processing patients inappropriately?** | ❌ | Not measurable from standard logs. | ✅ | Identify patterns where staff handle multiple patients in quick succession vs. distributed attention. Shows batching behavior. |
| **What is the impact of interruptions on staff efficiency?** | ❌ | Not addressable. Interruptions not logged in patient-centric data. | ✅ | Track when staff switch between patients mid-process. Shows context-switching frequency and impact on task completion time. |
| **How do weekday vs. weekend staffing patterns differ?** | 👌 | Compare staffing levels by day of week. Static comparison. | ✅ | Show actual staff utilization patterns by day. Reveals if weekend staff handle different volumes or patient types despite similar counts. |
| **Are patients getting continuity of care within a visit?** | 👌 | Count handoffs per patient case. | ✅ | Show if handoffs are coordinated (overlapping staff at transition) or abrupt (gaps between staff interactions). |
| **Which non-clinical activities consume the most time?** | ❌ | Not typically distinguished in activity logs. | 👌 | If administrative tasks are logged, show time spent on non-clinical events per staff member. Reveals administrative burden. |
| **How does patient satisfaction correlate with staff interactions?** | 👌 | Correlate satisfaction scores with case characteristics. Aggregate analysis. | ✅ | Link satisfaction to specific staff members, interaction durations, and wait times. Shows which factors drive satisfaction. |
| **Are we cross-training staff effectively?** | ❌ | Not measurable from process logs. | ✅ | Track which activities each staff member performs over time. Shows skill diversity and cross-training effectiveness. |

## Key Trends and Takeaways

### **OCPM's Core Advantages Over Traditional Process Mining**

**1. Multi-Object Perspective**
- Traditional PM is fundamentally limited to single-case (patient) perspective
- OCPM natively handles multiple object types (patients, staff, equipment, rooms) simultaneously
- Enables analysis of complex interactions that traditional PM cannot capture

**2. Resource-Centric Analysis**
- Traditional PM treats resources as attributes, limiting resource-focused insights
- OCPM treats resources as first-class objects with their own lifecycles
- Enables direct analysis of staff utilization, workload balancing, and resource bottlenecks

**3. Causal Analysis Capability**
- Traditional PM shows correlations but struggles with causation
- OCPM can distinguish between different types of delays and bottlenecks
- Separates patient-side factors from resource-side constraints

### **Critical Gaps in Traditional Process Mining**

**Questions Traditional PM Cannot Answer (❌):**
- Staff-specific workflows and productivity patterns
- Resource capacity modeling and realistic throughput calculations
- Staff collaboration patterns and handoff effectiveness
- Individual staff performance and skill utilization
- Equipment and facility bottleneck analysis
- Real-time resource allocation optimization

**Questions Traditional PM Handles Poorly (👌):**
- Resource utilization beyond simple event counting
- Bottleneck analysis limited to activity-level delays
- Staff workload balancing and capacity planning
- Multi-resource coordination and synchronization
- Cost allocation based on actual resource usage

### **OCPM's Strategic Value Propositions**

**1. Operational Excellence**
- **Resource Optimization**: Direct measurement of staff utilization, idle time, and workload distribution
- **Capacity Planning**: Realistic throughput modeling based on actual resource constraints
- **Bottleneck Identification**: Distinguishes between activity bottlenecks and resource bottlenecks

**2. Quality and Safety**
- **Continuity of Care**: Tracks handoff quality and care coordination
- **Compliance Monitoring**: Real-time patient-to-staff ratio compliance
- **Process Standardization**: Identifies role overlap and delegation opportunities

**3. Financial Impact**
- **Cost Allocation**: Precise resource cost attribution per patient
- **Efficiency Metrics**: Staff productivity and resource utilization analysis
- **ROI Analysis**: Impact of staffing changes on patient outcomes and costs

**4. Strategic Decision Support**
- **Staffing Decisions**: Data-driven recommendations for optimal staff ratios and assignments
- **Process Redesign**: Evidence-based identification of improvement opportunities
- **Technology Investment**: Equipment and facility needs based on actual utilization patterns

### **Implementation Considerations**

**Data Requirements:**
- OCPM requires richer event logs with explicit object relationships
- Need to capture staff, equipment, and facility as separate object types
- May require data model changes from traditional case-centric logs

**Analytical Complexity:**
- More complex visualization and analysis compared to traditional PM
- Requires new analytical skills and tools
- May need to flatten to traditional views for some stakeholders

**Organizational Impact:**
- Enables more granular performance management
- Supports evidence-based staffing and resource allocation
- Provides foundation for continuous operational improvement

### **Conclusion**

Object-Centric Process Mining represents a paradigm shift from patient-centric to multi-object analysis, enabling healthcare organizations to answer critical operational questions that traditional process mining cannot address. While implementation requires more sophisticated data models and analytical approaches, the strategic value in resource optimization, quality improvement, and cost management makes OCPM essential for modern healthcare operations management.

