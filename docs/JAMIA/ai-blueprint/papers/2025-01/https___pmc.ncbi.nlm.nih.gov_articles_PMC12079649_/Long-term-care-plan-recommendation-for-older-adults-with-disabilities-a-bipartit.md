J Am Med Inform Assoc

. 2025 Jan 30;32(4):689–701. doi: [10.1093/jamia/ocae327](https://doi.org/10.1093/jamia/ocae327)

# Long-term care plan recommendation for older adults with disabilities: a bipartite graph transformer and self-supervised approach

[Chunlong Miao](https://pubmed.ncbi.nlm.nih.gov/?term="Miao%20C"[Author])

### Chunlong Miao, MSE

1 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

2 Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China

Data curation, Methodology, Investigation, Visualization

Find articles by [Chunlong Miao](https://pubmed.ncbi.nlm.nih.gov/?term="Miao%20C"[Author])

1,2, [Jingjing Luo](https://pubmed.ncbi.nlm.nih.gov/?term="Luo%20J"[Author])

### Jingjing Luo, PhD

3 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

4 Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China

Conceptualization, Methodology, Investigation, Supervision, Funding acquisition

Find articles by [Jingjing Luo](https://pubmed.ncbi.nlm.nih.gov/?term="Luo%20J"[Author])

3,4,✉, [Yan Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20Y"[Author])

### Yan Liang, PhD

5 School of Nursing, Fudan University, Shanghai, 200032, China

Conceptualization, Data curation, Investigation, Validation, Supervision

Find articles by [Yan Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20Y"[Author])

5, [Hong Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20H"[Author])

### Hong Liang, PhD

6 School of Social Development and Public Policy, Fudan University, Shanghai, 200433, China

Data curation, Methodology, Resources, Validation

Find articles by [Hong Liang](https://pubmed.ncbi.nlm.nih.gov/?term="Liang%20H"[Author])

6, [Yuhui Cen](https://pubmed.ncbi.nlm.nih.gov/?term="Cen%20Y"[Author])

### Yuhui Cen, ME

7 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

Methodology

Find articles by [Yuhui Cen](https://pubmed.ncbi.nlm.nih.gov/?term="Cen%20Y"[Author])

7, [Shijie Guo](https://pubmed.ncbi.nlm.nih.gov/?term="Guo%20S"[Author])

### Shijie Guo, PhD

8 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

Methodology

Find articles by [Shijie Guo](https://pubmed.ncbi.nlm.nih.gov/?term="Guo%20S"[Author])

8, [Hongliu Yu](https://pubmed.ncbi.nlm.nih.gov/?term="Yu%20H"[Author])

### Hongliu Yu, PhD

9 Institute of Intelligent Rehabilitation Engineering, University of Shanghai for Science and Technology, Shanghai, 200093, China

Funding acquisition, Validation, Supervision

Find articles by [Hongliu Yu](https://pubmed.ncbi.nlm.nih.gov/?term="Yu%20H"[Author])

9,✉

*   Author information
*   Article notes
*   Copyright and License information

1 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

2 Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China

3 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

4 Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China

5 School of Nursing, Fudan University, Shanghai, 200032, China

6 School of Social Development and Public Policy, Fudan University, Shanghai, 200433, China

7 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

8 Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China

9 Institute of Intelligent Rehabilitation Engineering, University of Shanghai for Science and Technology, Shanghai, 200093, China

✉

Corresponding authors: Jingjing Luo, PhD, Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, D2 Building, Wangu Science and Technology Park, No. 1566 Guoquan North Road, Yangpu District, Shanghai 200438, China (luojingjing@fudan.edu.cn) and Hongliu Yu, PhD, Institute of Intelligent Rehabilitation Engineering, University of Shanghai for Science and Technology, 13th Floor, Advanced Manufacturing Building, Shanghai University of Engineering Science, No. 580, Junxiao Road, Yangpu District, Shanghai 200093, China (yhl\_usst@outlook.com)

#### Roles

**Chunlong Miao**: MSE, Data curation, Methodology, Investigation, Visualization

**Jingjing Luo**: PhD, Conceptualization, Methodology, Investigation, Supervision, Funding acquisition

**Yan Liang**: PhD, Conceptualization, Data curation, Investigation, Validation, Supervision

**Hong Liang**: PhD, Data curation, Methodology, Resources, Validation

**Yuhui Cen**: ME, Methodology

**Shijie Guo**: PhD, Methodology

**Hongliu Yu**: PhD, Funding acquisition, Validation, Supervision

Received 2024 Aug 10; Revised 2024 Dec 19; Accepted 2025 Jan 2; Collection date 2025 Apr.

© The Author(s) 2025. Published by Oxford University Press on behalf of the American Medical Informatics Association. All rights reserved. For commercial re-use, please contact reprints@oup.com for reprints and translation rights for reprints. All other permissions can be obtained through our RightsLink service via the Permissions link on the article page on our site—for further information please contact journals.permissions@oup.com.

This article is published and distributed under the terms of the Oxford University Press, Standard Journals Publication Model ([https://academic.oup.com/pages/standard-publication-reuse-rights](https://academic.oup.com/pages/standard-publication-reuse-rights))

[PMC Copyright notice](/about/copyright/)

PMCID: PMC12079649  PMID: [39883541](https://pubmed.ncbi.nlm.nih.gov/39883541/)

## Abstract

### Background

With the global population aging and advancements in the medical system, long-term care in healthcare institutions and home settings has become essential for older adults with disabilities. However, the diverse and scattered care requirements of these individuals make developing effective long-term care plans heavily reliant on professional nursing staff, and even experienced caregivers may make mistakes or face confusion during the care plan development process. Consequently, there is a rigid demand for intelligent systems that can recommend comprehensive long-term care plans for older adults with disabilities who have stable clinical conditions.

### Objective

This study aims to utilize deep learning methods to recommend comprehensive care plans for the older adults with disabilities.

### Methods

We model the care data of older adults with disabilities using a bipartite graph. Additionally, we employ a prediction-based graph self-supervised learning (SSL) method to mine deep representations of graph nodes. Furthermore, we propose a novel graph Transformer architecture that incorporates eigenvector centrality to augment node features and uses graph structural information as references for the self-attention mechanism. Ultimately, we present the Bipartite Graph Transformer (BiT) model to provide personalized long-term care plan recommendation.

### Results

We constructed a bipartite graph comprising of 1917 nodes and 195 240 edges derived from real-world care data. The proposed model demonstrates outstanding performance, achieving an overall F1 score of 0.905 for care plan recommendations. Each care service item reached an average F1 score of 0.897, indicating that the BiT model is capable of accurately selecting services and effectively balancing the trade-off between incorrect and missed selections.

### Discussion

The BiT model proposed in this paper demonstrates strong potential for improving long-term care plan recommendations by leveraging bipartite graph modeling and graph SSL. This approach addresses the challenges of manual care planning, such as inefficiency, bias, and errors, by offering personalized and data-driven recommendations. While the model excels in common care items, its performance on rare or complex services could be enhanced with further refinement. These findings highlight the model's ability to provide scalable, AI-driven solutions to optimize care planning, though future research should explore its applicability across diverse healthcare settings and service types.

### Conclusions

Compared to previous research, the novel model proposed in this article effectively learns latent topology in bipartite graphs and achieves superior recommendation performance. Our study demonstrates the applicability of SSL and graph transformers in recommending long-term care plans for older adults with disabilities.

**Keywords:** care plan recommendation, graph neural network, graph self-supervised learning, graph transformer

## Background and significance

By 2030, 1 in 6 individuals globally will be aged 60 years or older, with the population rising from 1 billion in 2020 to a projected 1.4 billion, and reaching 2.1 billion by 2050.[1](#ocae327-B1) Due to physical, psychological, and social barriers that lead to a decline in functioning and reduced self-care, a significant number of older individuals require comprehensive long-term care. Even with the involvement of multi-disciplinary experts in formulating care plans, issues such as information transfer and coordination among these professionals persist. Additionally, implicit biases among nursing personnel towards patients can lead to divergences in the development of care plans.[2](#ocae327-B2) An efficient and precise approach to making recommendations is essential for ensuring ongoing well-being and quality of life for this demographic, as well as for alleviating strain on society’s healthcare system in the context of an aging population.

In healthcare facilities such as hospitals and nursing homes, the Clinical Care Classification (CCC) system has been widely utilized in the development of care plans.[3–6](#ocae327-B3) However, it relies on comprehensive clinical assessment data to enable timely and dynamic interventions in acute care planning. When the disability-related clinical conditions of older adults are stable, a crucial need arises for long-term care plans and daily-life related complex care requirements. Recent studies have applied deep learning and intelligent algorithms to enhance healthcare services for older adults. For instance, Tang et al.[7](#ocae327-B7) introduced a health analytic model using the Internet of Medical Things to improve healthcare services in nursing homes. Zhang et al.[8](#ocae327-B8) explored deep learning applications to improve patient outcome predictions and healthcare management. Martinez and Yannakakis[9](#ocae327-B9) proposed deep multimodal fusion techniques that combine discrete events and continuous signals, which can be applied to interpret complex behaviors in elderly care scenarios. For patient-specific clinical information retrieval, Rasmy et al.[10](#ocae327-B10) explored deep learning to create personalized care plans. Kumar et al.[11](#ocae327-B11) discussed deep learning-based health data analytics in smart hospital environments, highlighting the role of algorithms in improving patient care without relying on additional hardware. Li et al.[12](#ocae327-B12) developed predictive models that identify readmission risks, supporting individualized and proactive patient care strategies. These approaches showcase the potential of advanced algorithms in addressing the complex long-term care requirements of older adults with disabilities. However, they still encounter challenges due to the interdisciplinary nature of care requirements, leading to imbalanced development, lack of continuity, and organizational difficulties in existing care plan recommendation approaches.[13](#ocae327-B13)

The current approaches have difficulties to capture the nuanced and multifaceted relationships between care service items and older adults’ disabilities, leading to recommendations that may not fully address the individualized needs. Given these challenges, there is a pressing need for an efficient and precise approach to recommending long-term care plans that can effectively handle complex relational data. In recent years, graph-based recommendation systems using Graph Neural Networks (GNNs) have undergone significant development modeling the interactions and relationships between patients and features and are widely employed in clinical settings.[14](#ocae327-B14) For instance, Choi et al.[15](#ocae327-B15) proposed the graph-based attention model, which utilizes medical ontologies structured as graphs to enhance predictive modeling from Electronic Medical Records (EMRs) by capturing hierarchical relationships among medical concepts. Similarly, Shang et al.[16](#ocae327-B16) developed G-BERT that incorporates medical knowledge graphs into the pre-training process to improve medication recommendation. Yao et al.[17](#ocae327-B17) applied graph recurrent networks with attributed random walks for clinical risk prediction on EMRs, effectively modeling temporal and relational information in patient data. In treatment planning, graph-based methods have assisted in personalizing therapy recommendations by modeling the relationships between various clinical factors and patient outcomes, thus improving treatment effectiveness.[18](#ocae327-B18) These applications demonstrate the capability of graph-based models to manage intricate relationships in clinical data, improving diagnostic accuracy and treatment recommendations by capturing subtle patterns and correlations.

However, traditional GNNs have limitations, including limited receptive fields, excessive compression of node features, and an inability to handle long-distance dependencies, which ultimately restrict their expressive ability. In the context of long-term care plan recommendation, these limitations hinder the model’s ability to capture the complex and long-range interactions between different care service items and older adults’ conditions. For example, the excessive compression of node features can lead to the loss of critical older adults’ information, adversely affecting recommendation accuracy. In this study, we have considered including the Transformer architecture,[19](#ocae327-B19) recognized as a powerful neural network capable of capturing long-range dependencies through its self-attention mechanism, as a potential solution. Variants of models built on Transformer have demonstrated excellent performance in computer vision[20](#ocae327-B20) and natural language processing tasks.[21](#ocae327-B21) There have also been numerous attempts to introduce Transformer into the graph domain,[22–24](#ocae327-B22) aiming to overcome the limitations of GNNs.

Despite these advancements, challenges like sparse data representation and extracting implicit associations in clinical recommendations remain unresolved. In long-term care planning, the data is often heterogeneous and sparse, making it difficult for models to learn effective representations without extensive labeled data. Moreover, implicit associations between care activities and patient outcomes are hard to capture due to the complexity of patient needs and care interventions. Therefore, leveraging the strengths of graph transformers, we need to design novel graph transformer architectures aimed to enhance learnable information, which ultimately could provide a promising direction for improving long-term care plan recommendations for older adults with disabilities.

In this article, we propose a novel paradigm for care plan recommendation for older adults with disabilities based on specifically designed graph transformer and graph self-supervised learning (SSL) to alleviate the fragmentation and imbalance in home care planning. Our contribution can be summarized as follows:

1.  We propose a novel model architecture named BiT (Bipartite Graph Transformer), which incorporates information of graph structure and node significance into the self-attention mechanism of Transformer architecture. This enhancement empowers GNN model to uncover latent topology beyond the bipartite graph structure, thereby preventing information loss during node representation updates.
    
2.  We present a novel framework for recommending long-term care plans to older adults with disabilities, which integrates a method for modeling care data based on bipartite graph structure, graph SSL, and implicit relationship mining. Additionally, it incorporates a graph transformer recommendation model designed in conjunction with these methods, enabling more personalized and accurate care plan suggestions.
    

By integrating these innovations, our approach aims to significantly improve the accuracy and effectiveness of long-term care plan recommendations, ultimately enhancing the quality of life for older adults with disabilities and reducing pressure on the healthcare system.

## Materials and methods

### Problem definition

As shown in [Figure 1](#ocae327-F1), The task of long-term care plan recommendation aims to develop a model or framework that utilizes comprehensive information from various data sources to recommend suitable long-term care plans for older adults with disabilities. Each care plan comprises multiple care service items and their corresponding recommended frequencies, which should comprehensively and individually address the care requirements of older adults with disabilities. Formally, the problem can be defined as:

> **Input:** a collection of information on older adults _i_ with disabilities: Info_i_ = (ADL, IADL,…)
> 
> **Output:** a comprehensive long-term care plan CP_i_ for a disabled older adult i with multiple care service items, and it is mapped from the input through a learning model of _f_: Info→CP.

#### Figure 1.

[![Graphical representation of the problem definition for long-term care plan recommendation, highlighting the model's input, output, current challenges, and ultimate goal.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/4087f3f29648/ocae327f1.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f1.jpg)

[Open in a new tab](figure/ocae327-F1/)

Illustration of problem definition for long-term care plan recommendation. This study addresses the problem of formulating long-term care plans using care data, aiming to develop an artificial intelligence-based system to resolve current challenges in the care plan formulation process.

### Data collection and preprocessing

We included all community-dwelling older adults who received a qualification assessment for public Long-term Care Insurance (LTCI) between September 1 and December 31, 2018, in Yiwu, Zhejiang province, China. Yiwu LTCI was initiated in September 2018 as part of China’s National Long-term Care Insurance Pilot Project, making all registered residents eligible for participation. The target population primarily consisted of physically disabled older adults aged 60 years and above during the study period.

The data used in this study were extracted from the LTCI claimants’ database and included sociodemographic characteristics, care dependency indicators (eg, impairments, physical disabilities, and chronic conditions), and suggested care plans ([Figure 2](#ocae327-F2)). A set of standardized assessments was administered by trained professionals (nurses and doctors) who visited claimants’ homes to determine LTCI eligibility.

#### Figure 2.

[![Graphs and bar charts illustrating participants' data information and distributions, including the care requirements survey, categories of care service items, distribution of care service item selection, and participant distribution by the number of required care items.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/469b2e814c42/ocae327f2.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f2.jpg)

[Open in a new tab](figure/ocae327-F2/)

Illustration of participants’ data involved in this study, the care requirements survey (upper left), the care service items (upper right), the distribution of participant count for each care service item (lower left), and participant distribution for count of care service items (lower right).

As part of the data preprocessing, we addressed missing or incomplete responses in the long-term care needs assessment to ensure the quality and integrity of the dataset. Any older adults with significant missing data, where essential information such as Activities of Daily Living (ADL) or medical history was absent, were excluded from the study to maintain a consistent dataset. For less critical missing values, we employed imputation techniques to handle data gaps. Specifically, we used mean imputation for continuous variables, such as age and health scores, and mode imputation for categorical variables, such as ADL categories or care service selections, to preserve the distribution of the data without introducing bias. By implementing these strategies, we ensured that the dataset remained robust while minimizing the impact of missing data on the final analysis. Additionally, we excluded care service items that were selected fewer than 100 times, as these infrequent services contributed little to the overall care plan formulation and lacked statistical power. Out of the original 58 care service items, 34 were excluded based on this criterion, leaving 24 items for analysis. These remaining items covered a comprehensive range of care services, including hygiene, nutritional intake, elimination, mobility, comfort, safety, vital signs monitoring, and specialized medical care, that are essential for modeling and predicting long-term care plans.

The final data collection included 1882 older adults and 24 care service items. We also utilized 35 question-answer pairs from the care requirements survey, which encompassed detailed aspects of mobility, ADL, Instrumental Activities of Daily Living (IADL), mental status, and overall health conditions. Each older adult required an average of 9.7 care service items, with care needs ranging from a minimum of 6 to a maximum of 16 items. Detailed descriptions of the care requirements questionnaire, care service items, and excluded care service items are provided in [Supplementary Material Tables S1-S3](#sup1), respectively.

### Graph construction

A bipartite graph is a versatile structure that represents the relationship between 2 types of nodes and has been widely applied in various real-world scenarios, such as recommendation systems and drug discovery. In the realm of geriatric care, care data encompasses a comprehensive set of information about the personal details, care requirements, and services provided to older adults with disabilities, capturing essential aspects such as their health status, living conditions, and the types of daily living assistance they require. In real-world older adults’ care data, interactions between older adults and their conditions can be represented using a bipartite graph, where each care plan serves as a target label to be predicted for each older adult node. Modeling real-world care data with bipartite graphs preserves the original features and relationships, enabling the application of advanced graph algorithms to enhance the accuracy and personalization of care plan recommendations.

In current research on graph-based recommendation methods, the majority of studies are focused on designing graph-based recommendation models. However, the construction of graph datasets is equally crucial, encompassing the creation of edges and generation of node features. The quality of these datasets significantly impacts the performance of downstream task models. While common graph construction methods may meet basic requirements for downstream tasks, we argue that they are suboptimal for actual recommended tasks due to 2 reasons: (1) they do not consider implicit relationships between nodes of the same type; (2) initial node feature quality needs improvement due to limitations in raw data.

In this section, we focus on the problem of modeling care data with bipartite graph. We first extract nodes and explicit relationships from the care data to build a basic bipartite graph. Then, we employ graph SSL to derive deep node embeddings and utilize second-order proximity to mine implicit relationships within the bipartite graph, thereby addressing the limitations of traditional bipartite graph construction methods. The bipartite graph dataset construction framework proposed in this article is shown in [Figure 3](#ocae327-F3).

#### Figure 3.

[![Graphical representation of bipartite graph dataset construction method, including node and relationship extraction, node deep representation mining based on graph self-supervised learning and implicit relationship modeling.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/ef8e8939c268/ocae327f3.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f3.jpg)

[Open in a new tab](figure/ocae327-F3/)

Illustration of bipartite graph dataset construction method, including node and relationship extraction, node deep representation mining based on graph SSL and implicit relationship modeling. The “emb.” refers to embedding, and “rel.” refers to relation. By employing the aforementioned methods, the features and relational information within the original care data can be fully preserved and augmented.

#### Basic graph: nodes and explicit relation

We start by extracting entities and relationships to construct a basic graph, forming the foundation of the complete bipartite graph dataset. This graph is structured based on a “homebound older adults”-“features” ontology, as illustrated in [Figure 3](#ocae327-F3).

Graph nodes: For care data, each case sample is regarded as a “disabled older adult” node _vu_∈_Vu_, and all information items appearing in the care data, such as cognitive ability, are regarded as different “feature” nodes _vs_∈_Vs_.

Graph edges: when the older adults with disabilities in the case has a certain characteristic, the explicit edge connecting the “older adults with disabilities” node and the corresponding “feature” node is established, that is, for each older adult and feature interaction binary pair (_vu_, _vs_), there is an edge _e_(_vu_, _vs_)∈_E_, then the care data can be represented by the bipartite graph _G_ = (_V_, _E_), where _V_ = _Vu_∪_Vs_, and the edge weight of the graph is set as 1.

#### Modeling implicit relation

In contrast to homogeneous networks, bipartite networks consist of 2 types of nodes. While edges only connect nodes of different types, there are implicit relationships between vertices of the same type. For instance, in our bipartite graph modeling older adults and their features, if 2 older adults share several common features, such as similar health conditions or care requirements, there exists an implicit relationship between them. Both explicit and implicit relations are valuable for uncovering diverse semantic meanings in bipartite graphs. It has been recently demonstrated that modeling such implicit relationships can enhance recommendation performance.[25](#ocae327-B25) However, current methods for constructing data sets based on bipartite graph structure only capture explicit relationships while overlooking potential implicit relationships.

Inspired by LINE,[26](#ocae327-B26) we utilize the second-order proximity to quantify the strength of implicit connections between nodes of the same type in a bipartite graph. Given a bipartite graph, the second-order proximity assumes that nodes sharing many connections to other nodes are similar to each other. For each edge (_i_, _j_), define the probability of producing a neighbor node _j_ for a given node _i_:

|  | (1) |
| --- | --- |

where |_V_| is the number of neighbors. For each node _vi_, [eqn (2)](#E2) actually defines a conditional distribution _p_(·_|vi_) over the neighbor nodes. To preserve the second-order proximity, we should make the conditional distribution of the contexts _p_(·|_vi_)be close to the empirical distribution. , and here we adopt KL-divergence as the distance function. Therefore, we minimize the following objective function:

|  | (2) |
| --- | --- |

We utilize cosine similarity to assess the implicit relations strength among nodes of the same type, with a predefined similarity threshold of 0.85. Nodes surpassing this threshold will establish an implicit relation. A more principled approach for selecting threshold is to set it as a learnable parameter, which we leave as future work.

#### Node embedding

The characteristics of care data in real-world settings often demonstrate sparsity and a significant long-tail distribution. For example, older adults with disabilities may possess only a limited number of these features, resulting in incomplete characterization and diminished performance of recommendation models. This leads to the inefficient utilization of valuable care data. The SSL paradigm can effectively address these challenges by extracting profound embeddings from samples and has exhibited superior performance, generalization and robustness compared to directly supervised learning in tasks such as computer vision[27](#ocae327-B27) and natural language processing.[28](#ocae327-B28)

In this article, we employ a prediction-based graph SSL approach to extract deep features from older adults with disabilities. Specifically, we first encode the attributes of these individuals using the Sentence-BERT[29](#ocae327-B29) encoder. Next, we apply the K-Nearest Neighbors (KNNs) clustering algorithm to group the encoded feature data, using these clusters as pseudo labels. A 2-layer GNN serves as a decoder to predict these pseudo labels. By optimizing the loss function \[[eqn (3)\]](#E3), we derive embeddings that capture informative representations of each older adult.

|  | (3) |
| --- | --- |

where _c_ denotes the cluster label obtained from KNNs clustering for the initial embedding. The objective function utilizes the prediction results from GNN decoder and _c_ to compute the cross entropy loss. In the “Experimental” section, we will utilize t-Distributed Stochastic Neighbor Embedding (t-SNE)[30](#ocae327-B30) for visualizing the learned embeddings to demonstrate the discriminative effectiveness of our SSL approach.

### Model architecture

While graphs effectively model the relationships between older adults with disabilities and their clinical features, traditional GNNs have limitations in capturing long-range dependencies and implicit relationships. These shortcomings can lead to imbalances in care planning, as important but indirect connections between data points may be overlooked. To address these limitations, we propose integrating the self-attention mechanism of Transformers into the GNN framework. This integration allows us to investigate latent topologies and implicit relationships between older adults and their features more effectively. In this section, we introduce our novel BiT model, which aims to develop comprehensive and personalized care plan recommendations by leveraging the strengths of both GNNs and Transformers.

The Transformer architecture is composed of multiple Transformer layers, each consisting of a self-attention module and a position-wise feed-forward network (FFN) as depicted in [eqn (4)](#E4) and [eqn (5)](#E5).

|  | (4) |
| --- | --- |

|  | (5) |
| --- | --- |

where _A_ is a matrix capturing the similarity between queries and keys. _H_∈_Rn_×_d_ denote the input of self-attention module where _d_ is the hidden dimension, The input _H_ is then transformed by 3 matrices _WQ_∈_Rd_×_dK_, _WK_∈_Rd_×_dK_, and _W_∈_Rd_×_dV_ to obtain attention matrix _Q_, _K_, _V_.

While some work has been done to integrate graph structure information into Transformer architecture, there remains a pressing need for graph transformer model that specially designed for bipartite graphs, which are widely utilized in recommendation systems but possess distinct characteristics. We propose a novel model called BiT, which incorporates 3 bipartite graph encoding: (1) DeepWalk based spatial encoding, (2) Adaptive shortest path encoding, and (3) Type-aware centrality encoding. The first 2 encodings, focused on topology and local structure of bipartite graph, are integrated into the Transformer’s attention mechanism after the scaling operation to enhance structural context. The type-aware centrality encoding, designed to capture the relative significance of nodes, is directly incorporated into the node embeddings to enrich node representations. The novel graph Transformer architecture is shown in [Figure 4](#ocae327-F4). Three encodings are described in detail below.

#### Figure 4.

[![Graphical representation of the Bipartite Graph Transformer (BiT) model architecture, illustrating how three bipartite graph encodings (adaptive shortest path spatial encoding, type-aware centrality encoding, and DeepWalk-based structure encoding) interact with the Transformer self-attention mechanism.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/840d55248de2/ocae327f4.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f4.jpg)

[Open in a new tab](figure/ocae327-F4/)

Architecture of the proposed Bipartite Graph Transformer (BiT) model. BiT extracts 3 graph encodings specifically designed for bipartite graphs from the original graph structure, and integrates these with the Transformer architecture, enabling BiT to effectively process bipartite graph data, (1) DeepWalk-based spatial encoding (number of nodes × number of nodes), (2) Adaptive shortest path encoding (number of nodes × number of nodes), and (3) Type-aware centrality encoding (number of nodes × node dimension). The total number of nodes is 1882, and the node dimension is 384.

#### Type-aware centrality encoding

In the care planning bipartite graph dataset, node importance serves as a crucial discriminative factor for model reasoning. In a bipartite graph, the significance of a node is influenced by the importance of its neighboring nodes. Therefore, in BiT, we have developed type-aware eigenvector centrality encoding to represent node importance in the bipartite graph, taking into consideration both the direct connections and the significance of neighbors. We incorporate the centrality encoding into each node’s features by simply adding it to the node attributes as input.

|  | (6) |
| --- | --- |

where _λ_ is a constant and _A_ is the adjacency matrix, _u_ represents the target node, while _v_ represents the neighbor node of node _u_. is a learnable parameter related to node type. Specifically, we use power iteration to efficiently compute the eigenvector centrality scores of nodes. By incorporating the eigenvector centrality encoding into the input features, the model can capture both semantic correlations and node importance within the attention mechanism.

#### DeepWalk based structure encoding

Due to the characteristics of the self-attention mechanism, Transformer has a global receptive field, which necessitates explicitly defining the positional information of tokens. For example, when processing sequence data such as natural language, Transformers inject absolute or relative positional information by adding positional coding to the input representation. The DeepWalk algorithm utilizes random walks to capture the interconnections between nodes, representing them through unsupervised learning to produce low-dimensional vector representations that effectively capture the topological relationships within the network. To enable transformer to understand the spatial information of nodes in the graph, we propose a novel spatial coding based on DeepWalk[31](#ocae327-B31) embedding for every node, specifically, for node _u_, we denote its DeepWalk embedding as Dw(_u_), In this article, we use the following formula to calculate the DeepWalk based spatial encoding (DWE)：

|  | (7) |
| --- | --- |

#### Adaptive shortest path spatial encoding

Topology distance is an important type of structural information in graph data that can be used to describe the topology similarity. For each central node, the topological distances to different attention sample nodes can have varying influences. By incorporating the implicit relationships proposed earlier, our constructed bipartite graph with implicit relations can more accurately reflect the semantic distances between nodes under specific circumstances compared to the basic bipartite graph. Therefore, we propose to calculate positional encoding based on the adaptive shortest path with shortcuts to describe the topology distance for the Transformer. Specifically, we denote the shortest path hop matrix as _P._ for each node _vi_ and its attention sample node _vj_, the shortest path hop on bipartite graph with and without implicit relations are _P_(_i_, _j_) and (_i_, _j_), respectively. We calculate the shortest path hop based positional encoding (SPE) for every attention sample node as:

|  | (8) |
| --- | --- |

where avg () represents the average operation, is a learnable parameter, and MLP() is a 2-layer neural network.

## Experiments

### Baselines

We compare our method with many state-of-the-art baselines, which can be divided into 2 categories: GNN based baselines and Transformer based baselines. For GNN based baselines we compare with the following models:

GCN:[32](#ocae327-B32) This model is widely utilized in the field of graph deep learning. GCN employs convolution operations to learn embedded representations of nodes within graph structures, with its primary advantages stemming from parameter sharing and the capacity to capture local graph structure features.

GraphSAGE:[33](#ocae327-B33) a highly effective GNN capable of producing top-tier node embeddings through the sampling and aggregation of neighboring node features. Renowned for its adaptability and scalability, GraphSAGE supports various aggregate functions and is well-suited for processing large-scale graph data.

GAT:[34](#ocae327-B34) An advanced GNN employing attention mechanisms to acquire node embeddings. Through adaptively assigning weights to edges in a graph, GAT can effectively capture intricate relationships between nodes and, with the aid of multi-head attention, learn the structural characteristics of the graph from diverse perspectives.

For Transformer based baselines we compare with the following models:

GraphGPS:[22](#ocae327-B22) The GraphGPS system effectively processes heterogeneous graph data using a self-attention mechanism and supports multi-task learning, enabling high performance in node classification, link prediction, and other tasks. Its modular design ensures scalability and efficiency.

LightGT:[23](#ocae327-B23) LightGT effectively captures the intricate relationships within multimedia content by integrating graph structure and a self-attention mechanism, and is specifically designed to cater to the requirements of recommendation systems.

### Evaluation protocols

We split the dataset into training, validation, and test sets in an 8:1:1 ratio by dividing participants (older adults) into 3 distinct groups, ensuring that no individual appeared in more than 1 dataset. This approach aimed to prevent data leakage and ensure a robust evaluation of the model. For each participant in the training, validation, or test set, their complete set of associated edges (ie, the links between the individual and care service items) was fully retained. The validation set and testing set are respectively used to tune the hyper-parameters and evaluate the performance in the experiments. We utilize 5-fold cross-validation to assess the model’s generalization performance. Moreover, following the widely used evaluation metrics, we adopted Recall, Precision, Fl-Score, and Accuracy to evaluate the performance of methods. Additionally, we employed single-tailed paired t-test on all metrics comparing the BiT model with SSL to other baseline models ensuring that the observed performance differences are not due to random chance but are statistically significant.

### Experimental settings

We use the PyTorch and torch-geometric packages to implement our proposed model. We start by initializing the model parameters using the Xavier algorithm[35](#ocae327-B35) and then proceed to optimize them with the Adam optimizer.[36](#ocae327-B36) In order to determine the appropriate learning rate and regularization weight, we perform a grid search within the ranges of {0.0001, 0.001, 0.01, 0.1, 1} and {0.00001, 0.0001, 0.001, 0.01, 0.1}, respectively. If there is no improvement in recall on the validation data for a continuous period of 20 epochs, we halt the training process and present our findings based on testing dataset results. As for the baselines, we adhere to their respective methodologies as outlined in their publications to achieve optimal performance. We make use of Nvidia TITAN RTX graphics card (24GB Memory) for all the experiments.

## Results

### Bipartite graph construction

The recommended dataset is constructed based on the methodology illustrated in [Figure 3](#ocae327-F3). Disabled older adult and feature nodes are extracted from the original care data, with initial node features generated by the pre-trained model Sentence-BERT and further enhanced by Graph SSL. The relationships between nodes consist of observed display relationships and implicit relationships generated based on second-order proximity.

Ultimately, we constructed a bipartite graph dataset for care plan recommendations, consisting of 1917 nodes and 195 240 edges. The node set comprises 1882 disabled older adult nodes and 35 feature nodes, The node embeddings are generated using the Sentence-BERT encoder, producing embeddings with a dimensionality of 384. Each node is assigned a multi-hot code of length 24 as its label, indicating the specific care service items required by the older adults with disabilities. The edge set includes 123 168 observable edges representing relationships between disabled older nodes and feature nodes in the original care data, as well as 72 072 implicit relationships between disabled older nodes. The interplay between the samples and their features holds equal significance in model reasoning. The care data modeling method employed in this study, which is grounded in bipartite graph structure, graph SSL, and implicit relationship discovery, effectively preserves, and enriches the feature and relationship information present in the original data, thereby laying the groundwork for constructing a care plan recommendation model.

### Evaluation for care plan recommendation

[Table 1](#ocae327-T1) shows the model performance comparisons on the care plan bipartite graph dataset. The bolded indicators represent the best performance, while the underlined indicators represent the second best. BiT demonstrates superior performance across various metrics, with a recall of 89.57%, precision reaching 91.34%, and an accuracy of 89.11%. The recall metric measures the proportion of actual positive examples that are correctly identified by the model, a high recall value indicating the model’s strong capacity to detect unnecessary care service items. Precision denotes the ratio of correctly predicted positive cases to the total predicted positive cases by the model, a high precision indicates that most recommended care service items are necessary and appropriate. The accuracy metric refers to the proportion of correct predictions (either positive or negative) made by the model; in our study, as the involved care service items of 24 has almost equal proportion for required or non-required items, thus the accuracy metric of 89.11% is slight smaller than the precision metric. BiT achieves an F1 score of 90.45%, which is the harmonic mean of precision and recall providing a balance between the 2 metrics. This result indicates that the model effectively balances the risk of mis-recommendation and missing important care measures when suggesting care plans. To confirm the statistical significance of the performance improvement, we conducted a single-tailed paired t-test on all metrics comparing the BiT model with SSL to other baseline models. The test results demonstrated that the improvements across all metrics for BiT over other models are statistically significant (_P_ <.05), confirming that the observed enhancement is unlikely to be due to random chance. The statistical significances are indicated by a single star in [Table 1](#ocae327-T1), and detailed paired t-test results are provided in the [Supplementary Material Table S5](#sup1).

#### Table 1.

Care plan recommendation results.

| Model | Recall (%) | Precision (%) | Accuracy (%) | F1 (%) |
| --- | --- | --- | --- | --- |
| GCN32 | 73.81 ± 0.48 | 71.15 ± 0.66 | 70.19 ± 0.44 | 71.98 ± 0.33 |
| GraphSAGE33 | 87.14 ± 0.24 | 71.38 ± 0.26 | 77.08 ± 0.21 | 78.06 ± 0.29 |
| GAT34 | 86.11 ± 0.26 | 74.28 ± 0.12 | 78.57 ± 0.29 | 79.54 ± 0.38 |
|  |  |  |  |  |
| GraphGPS22 | 85.52 ± 0.41 | 87.43 ± 0.56 | 86.42 ± 0.48 | 85.98 ± 0.17 |
| LightGT23 | 86.51 ± 0.32 | 79.42 ± 0.51 | 82.14 ± 0.33 | 82.85 ± 0.11 |
|  |  |  |  |  |
| BiT-w/o SSL | 88.15  ± 0.11 | 88.53  ± 0.18 | 88.64  ± 0.17 | 88.34  ± 0.12 |
| BiT-w/SSL | 89.57 ± 0.06\* | 91.34 ± 0.09\* | 89.11 ± 0.18\* | 90.45 ± 0.11\* |

[Open in a new tab](table/ocae327-T1/)

\* Indicates statistically significant improvements (P < 0.05) for BiT over other models.

Compared to previous GNN architectures, BiT demonstrates a significant performance advantage, with a 18.47% improvement in the F1 score compared to GCN. Further, BiT achieves 3.46% higher Recall, 17.06% higher Precision, 10.54% higher accuracy, and 10.91% higher F1 score than the best GNN baseline GAT, Compared with Transformer-based model, BiT achieves 4.05% higher Recall, 3.91% higher Precision, 2.69% higher Accuracy, and 4.47% higher F1 score than the best graph Transformer baseline GraphGPS. It can be noted that even without SSL, BiT still performs better than previous GNN and graph Transformer architectures. Using prediction-based graph SSL, BiT has achieved the most precise recommendations.

### Evaluation for recommendation of each care service item

In order to demonstrating the recommendation performance of our proposed model across various care service items, we further conducted a comparative analysis of the F1 scores for the recommendations of each individual care service item. As shown in [Figure 5](#ocae327-F5), the F1 score of the recommendation for all care service items reached a maximum of 96.64%, a minimum of 81.32%, and an average of 89.66%. The F1 score for each care service item reflects the model’s capability to identify older adults with disabilities in need of that specific item. Results imply that the BiT model is capable of effectively balancing the trade-off between incorrect and missed selections for each item, thereby enhancing the rationality of the recommended care plan. Additionally, across different care service items, the F1 of the BiT model employing Graph SSL is higher than that without Graph SSL. Specifically, among the care service items involved in this study, the F1 of the model using Graph SSL is 1.36%-5.04% higher than that without Graph SSL.

#### Figure 5.

[![Bar graph showing the recommendation F1 scores for 24 care service items, comparing models with and without Graph SSL, including error bars for each item.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/4c57014bb1f5/ocae327f5.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f5.jpg)

[Open in a new tab](figure/ocae327-F5/)

Recommendation F1 score of each care service item. Results demonstrate that the model efficiently manages the balance between incorrect and missed selections for each item, with the Graph SSL-enhanced model outperforming the one without Graph SSL.

### Evaluation of SSL for bipartite graph node embedding

To assess the efficacy of graph SSL in enhancing bipartite graph node embedding, we conducted an experiment using a 2-layer neural network to determine whether MLP can effectively discern the specific care requirements of older adults with disabilities. Accurately representing the semantic information of bipartite graph nodes is essential for optimizing the model’s recommendation performance. [Figure 6](#ocae327-F6) illustrates the classification results of care service item 1-12 before and after applying Graph SSL enhancement in a 2-layer neural network model, visualized using t-SNE. The color of the node indicates whether the disabled older adult require the care service item, it is evident that following the implementation of Graph SSL, samples from different categories can be more effectively distinguished in the t-SNE visual results. As mentioned earlier, [Figure 5](#ocae327-F5) illustrates that the implementation of Graph SSL leads to an enhancement in the recommendation accuracy for all care service items. The experimental results of other care service items are shown in the [Supplementary Material Figure S1](#sup1).

#### Figure 6.

[![Scatter plot labeled care service items 1 to 12, depicting the enhanced effect of Graph Self-supervised Learning on the bipartite graph node embedding, showing improved distinction between necessary and unnecessary items.](https://cdn.ncbi.nlm.nih.gov/pmc/blobs/f253/12079649/02257d02ddf7/ocae327f6.jpg)](https://www.ncbi.nlm.nih.gov/core/lw/2.0/html/tileshop_pmc/tileshop_pmc_inline.html?title=Click%20on%20image%20to%20zoom&p=PMC3&id=12079649_ocae327f6.jpg)

[Open in a new tab](figure/ocae327-F6/)

t-SNE visualization of the enhanced effects of Graph SSL. Data points represent whether a care service item is necessary or unnecessary for each older adult. Results demonstrate that the implementation of Graph SSL leads to an enhancement in separability in the bipartite graph. (A) Care service item 1-6 (B) care service item 7-12.

## Discussion and limitations

In this study, we present a novel framework for recommending long-term care plans for older adults with disabilities based on graph SSL and graph transformer BiT. A bipartite graph dataset based on real-world care data was constructed for model training and evaluation. The BiT model proposed in this article achieves an F1 score of 90.45%, which shows that the model effectively balances the risk of incorrect recommendations with the possibility of omitting crucial care measures when suggesting care plans. For each care service item, the F1 score reaching an average of 89.66%. Our results demonstrates that the framework proposed in this article is potentially applicable to long-term care plan formulation in real-world nursing settings.

The challenges of manual care plan generation and limited care services highlight the benefits of an AI-driven approach. The process of creating a care plan manually is both time-consuming and inefficient, with completion times varying from minutes to hours depending on the complexity of the case and the availability of professionals. Furthermore, in regions with underdeveloped long-term care systems and a shortage of skilled professionals, manual care planning is often inadequate. By reducing reliance on experts, AI models enable faster, scalable care planning across more areas. Lastly, manual care planning is also prone to errors and biases. For example, some home care agencies may base recommendations on available services rather than the specific needs of older adult clients, leading to motivational errors and inconsistencies. The BiT model addresses these challenges by offering a quality control tool that reduces discrepancies and biases. It ensures that care plans are more personalized and patient-centered while improving efficiency and equity by reducing reliance on experts and making care accessible to broader populations.

The current model has achieved state-of-the-art performance when compared to other advanced graph learning deep neural networks. The BiT model exhibits the best performance, achieving a high cross-validated F1 score of 90.45%, a recall of 89.57%, precision of 91.34%, and an accuracy of 89.11%, the results across all metrics significantly outperform those of other models. As can be seen in [Table 1](#ocae327-T1), BiT obtains best performance on care plan recommendation benchmark. A high recall value signifies that BiT effectively minimizes omissions and ensures the fulfillment of nearly all care requirements, which is crucial for guaranteeing comprehensive care for older adults with disabilities. High precision indicates that most recommended care plans are precise, ensuring that those provided to the older are necessary and appropriate. This reduces unnecessary or irrelevant recommendations, thereby enhancing the efficiency and quality of care services. The results demonstrate that the various enhancements we applied have significantly improved the efficacy of the graph transformer model’s performance.

[Figure 5](#ocae327-F5) illustrates the model’s performance across various care service items, revealing notable differences in F1 scores. Certain services, such as bed linen changes for the bedridden, oral care, perineal care, changing tops and pants, assistance with eating, bedpan use, colostomy bag care, enema administration, urinary catheterization, and restraint belt application, achieve high F1 scores. Simpler items like “oral care” which aligns closely with a straightforward questionnaire prompt (eg, “Does the subject need help with brushing teeth or rinsing the mouth?”), yield higher F1 scores due to the direct, rule-based correspondence between the questionnaire and the service recommendation. In such cases, rule-based approaches are effective, thereby enhancing model performance. However, the limitations of rule-based systems become apparent for more complex care items, such as the use of restraint belts, which require the model to synthesize a broader range of inputs. For example, restraint belt recommendations may involve not only the individual’s physical condition but also cognitive status, behavioral tendencies, and overall safety considerations, which are factors not fully captured by simple yes-or-no questions. Even when an individual is capable of independent ambulation, cognitive impairments or behavioral risks may necessitate the use of a restraint belt during specific activities to ensure safety. A purely rule-based approach might overlook these nuances, whereas our model integrates these complex data relationships, enabling more personalized and accurate care recommendations for such multifaceted items. In contrast, care service items with lower F1 scores tend to involve less frequent or more variable needs, often reflecting complex care scenarios or uncommon services. For instance, services like finger/nail care and specialized nursing such as ostomy care show lower F1 scores, likely due to the individualized and situational factors required for these recommendations. The variability in care frequency and individual preferences for these services makes it difficult for the model to predict needs accurately, as these are influenced by subjective factors that are not fully represented in the input features.

Most of the previous methods for recommending care plans were based on experiential knowledge, rule-based reasoning, or shallow neural networks. These models feature simplistic hierarchies that constrain their capacity to articulate intricate functions, particularly when confronted with diverse data types and structures.[37](#ocae327-B37),[38](#ocae327-B38) Furthermore, data in the medical and care domains often exhibit a long-tail distribution, and these approaches lack the requisite sensitivity to effectively handle such distributions. This may lead the model to prioritize certain categories while neglecting others during training, thereby impacting the model’s generalization capability. There was a significant imbalance in meeting the care requirements of older adults with disabilities. Due to the challenge of identifying the latent topology between samples and characteristics, the robustness of these methods may be low, leading to difficulties in ensuring the accuracy of recommended care plans. The bipartite graph modeling and graph SSL methods introduced in this study enhance the data quality at the original representation stage. The results are consistent with our hypothesis that the BiT is better suited for inference on bipartite graphs than GNN models and other Graph Transformers due to its latent topology mining capabilities.

The Graph Transformer method, which incorporates the Transformer architecture into the graph domain, demonstrates superior recommendation performance compared to classical GNN methods due to its attention mechanism that covers the entire graph. This observation aligns with our experimental results. As shown in [Table 1](#ocae327-T1), Transformer-based models consistently outperform GNN-based methods across 4 evaluation metrics; notably, the F1 score of the best graph Transformer baseline GraphGPS is 6.44% higher than that of the best GNN baseline GAT. However, these Graph Transformers are not specifically tailored for bipartite graphs and may yield suboptimal results when handling interactions between samples and features in recommendation domains. Leveraging implicit relationship modeling, the proposed BiT model in this article leverages the distinctive topological features of bipartite graphs by incorporating structural coding, centrality coding, and spatial coding into the Transformer framework. Experimental results on a bipartite graph dataset for care plans demonstrate the effectiveness and rationale of our proposed model.

To our knowledge, this is the first study to establish a long-term care plan recommendation model based on clinical data and graph transformer. The introduction of graph-based recommendation systems into the field of care plan development can create personalized care plans with high precision and efficiency, and provide significant cost savings, thus setting a new precedent for optimizing healthcare services. In contrast to manual care planning, which may be time-consuming and prone to delays due to the need for manual analysis and decision-making, the deep learning-based recommendation method proposed in this study can rapidly generate care plans. Consequently, the implementation of a recommender system can diminish the dependency on manual data analysis and decision-making, thereby reducing operational costs and minimizing patient wait times for care. For the government, the long-term care plan formulation method proposed in this article can serve as a valuable tool and reference for calculating and allocating medical service resources. It also provides a foundation for health departments to oversee medical institutions. For medical institutions, the method outlined in this article can enhance the efficiency of care plan formulation, mitigate instances of incorrect or omitted selection of care service items, and ultimately ensure that every disabled older adult in need of long-term care receives improved and higher quality support.

In real world care data, there may be sparsity in the feature space, meaning that some features occur infrequently or not at all. This can lead to the model not fully utilizing these features during the learning process, thereby reducing the model’s performance. We employ graph SSL to automatically derive labels or signals from data for the purpose of learning data representation, thereby mitigating the issue of feature sparsity. As illustrated in [Figure 6](#ocae327-F6), subsequent to feature enhancement through graph SSL, even MLP exhibits enhanced classification efficacy across individual labels. In addition to leveraging graph SSL learning, Large Language Models (LLMs) have recently made significant advancements in text embeddings.[39](#ocae327-B39),[40](#ocae327-B40) While our approach incorporates the inherent structural information of bipartite graphs, the LLM-based method may offer greater accuracy in word and sentence representation within the original domain. This aspect will be left for future exploration.

There are limitations in the current work. This study is inherently limited by its retrospective design, which restricts our ability to establish causal relationships between the care plan model and patient outcomes. The data analyzed were collected within a specific geographical region, potentially introducing biases related to regional healthcare practices and resource disparities. This limitation underscores the need for future research to validate the model’s efficacy across diverse healthcare systems and cultural contexts. Moreover, our analysis focused on high-frequency care needs, omitting low-frequency services due to data constraints. The exclusion of care service items occurring fewer than 100 times helped streamline the dataset, focusing on the most relevant and frequent services for older adults with disabilities. While this approach ensures that the model is trained on data with sufficient frequency for reliable prediction, it also means that less common care needs may not be fully represented in our model. This trade-off is important for improving model precision and reducing overfitting to rare cases but might result in the omission of low-frequency services that could be critical for some individuals. Future studies could consider using more comprehensive datasets to capture these rare services and potentially validate their importance in care plan formulation. Despite these limitations, our study introduces a novel graph-based recommendation approach, which we believe offers significant potential for methodological innovation in personalized care plan development. We encourage researchers to build upon this framework, tailoring it to various regional needs and expanding the scope of services considered, to enhance the global applicability and impact of care plans for this vulnerable population.

## Conclusion

We have presented a novel framework for long-term care plan recommendation, which encompasses a care data modeling approach based on bipartite graph structure and Graph SSL, as well as a graph transformer architecture named BiT. These 2 components collectively capture the profound semantic content of care data and the latent topological relationships among care plan samples. Extensive care plan recommendation experiments and visualization demonstrate the effectiveness and rationality of our BiT method. Our findings highlight the benefits of employing graph deep learning in care planning, and we advocate for further research in nursing or clinical areas to alleviate reliance on professional practitioners and reduce pressure on healthcare systems.

## Supplementary Material

ocae327\_Supplementary\_Data

[ocae327\_supplementary\_data.zip](/articles/instance/12079649/bin/ocae327_supplementary_data.zip) (1.2MB, zip)

## Contributor Information

Chunlong Miao, Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China; Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China.

Jingjing Luo, Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China; Robotics Engineering Research Center, Ji Hua Laboratory, Foshan, 528200, China.

Yan Liang, School of Nursing, Fudan University, Shanghai, 200032, China.

Hong Liang, School of Social Development and Public Policy, Fudan University, Shanghai, 200433, China.

Yuhui Cen, Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China.

Shijie Guo, Institute of AI and Robotics, Academy for Engineering and Technology, Fudan University, Shanghai, 200433, China.

Hongliu Yu, Institute of Intelligent Rehabilitation Engineering, University of Shanghai for Science and Technology, Shanghai, 200093, China.

## Author contributions

Chunlong Miao: Data curation, Methodology, Investigation, Writing, Visualization. Jingjing Luo: Conceptualization, Methodology, Investigation, Writing, Supervision, Funding acquisition. Yan Liang: Conceptualization, Data curation, Methodology, Investigation, Validation, Supervision. Hong Liang: Data curation, Methodology, Resources, Validation. Yuhui Cen: Methodology. Shijie Guo: Methodology. Hongliu Yu: Funding acquisition, Validation, Supervision.

## Supplementary material

[Supplementary material](#sup1) is available at _Journal of the American Medical Informatics Association_ online.

## Funding

This work was supported by the National Key Research and Development Program of China (Grant Number 2022YFC3601400/2022YFC3601401), the National Natural Science Foundation of China (Grant Number 72304071), and the Fudan University School of Nursing Research Fund (Grant Number FNF202356).

## Conflicts of interest

None declared.

## Data availability

The caregiving intervention data presented in this study involve personally identifiable information of the participants. To protect their privacy, the data are not publicly available. However, de-identified data may be accessed upon request for researchers who meet the criteria for access to confidential data. Any interested party should directly contact the corresponding author to discuss data sharing possibilities and conditions. Requests will be reviewed on a case-by-case basis, and data may be provided subject to the necessary agreements and approvals.

## References

*   1. World Health Organization. Ageing and health. Accessed January 2022. [https://www.who.int/news-room/fact-sheets/detail/ageing-and-health](https://www.who.int/news-room/fact-sheets/detail/ageing-and-health)
*   2. Groves PS, Bunch JL, Sabin JA.  Nurse bias and nursing care disparities related to patient characteristics: a scoping review of the quantitative and qualitative evidence. J Clin Nurs. 2021;30:3385-3397. \[[DOI](https://doi.org/10.1111/jocn.15861)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34021653/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Clin%20Nurs&title=Nurse%20bias%20and%20nursing%20care%20disparities%20related%20to%20patient%20characteristics:%20a%20scoping%20review%20of%20the%20quantitative%20and%20qualitative%20evidence&volume=30&publication_year=2021&pages=3385-3397&pmid=34021653&doi=10.1111/jocn.15861&)\]
*   3. Saba V. Clinical care classification (CCC) system: an overview. In: Harris M, ed. _Handbook of Home Health Care Administration_. Jones & Bartlett Learning; 2017:225-234.
*   4. Whittenburg L, Meetim A.  Electronic nursing documentation: patient care continuity using the clinical care classification system (CCC). Nurs Inform. 2016;225:13-17. \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27332153/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Nurs%20Inform&title=Electronic%20nursing%20documentation:%20patient%20care%20continuity%20using%20the%20clinical%20care%20classification%20system%20\(CCC\)&volume=225&publication_year=2016&pages=13-17&pmid=27332153&)\]
*   5. Feng RC, Chang P.  Usability of the clinical care classification system for representing nursing practice according to specialty. Comput Inform Nurs. 2015;33:448-455. \[[DOI](https://doi.org/10.1097/CIN.0000000000000107)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/26418298/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Comput%20Inform%20Nurs&title=Usability%20of%20the%20clinical%20care%20classification%20system%20for%20representing%20nursing%20practice%20according%20to%20specialty&volume=33&publication_year=2015&pages=448-455&pmid=26418298&doi=10.1097/CIN.0000000000000107&)\]
*   6. Zeffiro V, Sanson G, Vanalli M, et al.  Translation and cross-cultural adaptation of the clinical care classification system. Int J Med Inform.  2021;153:104534. \[[DOI](https://doi.org/10.1016/j.ijmedinf.2021.104534)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34332469/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Int%20J%20Med%20Inform.&title=Translation%20and%20cross-cultural%20adaptation%20of%20the%20clinical%20care%20classification%20system&volume=153&publication_year=2021&pages=104534&pmid=34332469&doi=10.1016/j.ijmedinf.2021.104534&)\]
*   7. Tang V, Lam HY, Wu CH, et al.  A two-echelon responsive health analytic model for triggering care plan revision in geriatric care management. J Organ End User Comput. 2022;34:1-29. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Organ%20End%20User%20Comput&title=A%20two-echelon%20responsive%20health%20analytic%20model%20for%20triggering%20care%20plan%20revision%20in%20geriatric%20care%20management&volume=34&publication_year=2022&pages=1-29&)\]
*   8. Zhang X, Li Y, Wang J, et al.  Deep learning for health informatics. IEEE J Biomed Health Inform. 2021;25:1774-1785. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20J%20Biomed%20Health%20Inform&title=Deep%20learning%20for%20health%20informatics&volume=25&publication_year=2021&pages=1774-1785&)\]
*   9. Martinez V, Yannakakis GN. Deep multimodal fusion: combining discrete events and continuous signals. In: _Proceedings of International Conference on Multimodal Interact_. ACM; 2014:34-41.
*   10. Rasmy L, Wu Y, Wang N, et al.  A study of deep learning for patient-specific clinical information retrieval. J Biomed Inform. 2018;84:103-113.29966746 \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Biomed%20Inform&title=A%20study%20of%20deep%20learning%20for%20patient-specific%20clinical%20information%20retrieval&volume=84&publication_year=2018&pages=103-113&)\]
*   11. Kumar N, Singh AK, Kumar N.  Deep learning-based health data analytics in smart hospital environment. Neural Comput Appl. 2021;33:12113-12128. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Neural%20Comput%20Appl&title=Deep%20learning-based%20health%20data%20analytics%20in%20smart%20hospital%20environment&volume=33&publication_year=2021&pages=12113-12128&)\]
*   12. Li M, Chen Z, Jiang H, et al.  Explainable artificial intelligence for predictive modeling in healthcare. Mach Learn Healthc. 2021;12:320-333. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Mach%20Learn%20Healthc&title=Explainable%20artificial%20intelligence%20for%20predictive%20modeling%20in%20healthcare&volume=12&publication_year=2021&pages=320-333&)\]
*   13. De JC, Ros WJG, van Leeuwen M, et al.  How professionals share an E-care plan for the elderly in primary care: evaluating the use of an E-communication tool by different combinations of professionals. J Med Internet Res.  2016;18:e304. \[[DOI](https://doi.org/10.2196/jmir.6332)\] \[[PMC free article](/articles/PMC5146326/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/27884811/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Med%20Internet%20Res.&title=How%20professionals%20share%20an%20E-care%20plan%20for%20the%20elderly%20in%20primary%20care:%20evaluating%20the%20use%20of%20an%20E-communication%20tool%20by%20different%20combinations%20of%20professionals&volume=18&publication_year=2016&pages=e304&pmid=27884811&doi=10.2196/jmir.6332&)\]
*   14. Yang L, Wang S, Tao Y, et al. DGRec: graph neural network for recommendation with diversified embedding generation. In: _Proceedings of the 16th ACM International Conference on Web Search and Data Mining_. ACM; 2023:661-669.
*   15. Choi E, Xiao C, Sun J. GRAM: graph-based attention model for healthcare representation learning. In: _Proceedings of 23rd ACM SIGKDD International Conference on Knowledge Discovery Data Mining_. ACM; 2017:787-795. \[[DOI](https://doi.org/10.1145/3097983.3098126)\] \[[PMC free article](/articles/PMC7954122/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/33717639/)\]
*   16. Shang J, Ma T, Xiao C, Sun J. Pre-training of graph augmented transformers for medication recommendation. In: _Proceedings of 28th International Joint Conference on Artificial Intelligence (IJCAI)_. AAAI Press; 2019:5953-5959.
*   17. Yao L, Wang X, Wang X, et al.  Graph recurrent networks with attributed random walks for clinical risk prediction on electronic health records. IEEE J Biomed Health Inform. 2020;24:2283-2290. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=IEEE%20J%20Biomed%20Health%20Inform&title=Graph%20recurrent%20networks%20with%20attributed%20random%20walks%20for%20clinical%20risk%20prediction%20on%20electronic%20health%20records&volume=24&publication_year=2020&pages=2283-2290&)\]
*   18. Ahmedt-Aristizabal D, Armin MA, Denman S, et al.  Graph-based deep learning for medical diagnosis and analysis: past, present and future. Sensors. 2021;21:4758. \[[DOI](https://doi.org/10.3390/s21144758)\] \[[PMC free article](/articles/PMC8309939/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/34300498/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Sensors&title=Graph-based%20deep%20learning%20for%20medical%20diagnosis%20and%20analysis:%20past,%20present%20and%20future&volume=21&publication_year=2021&pages=4758&pmid=34300498&doi=10.3390/s21144758&)\]
*   19. Vaswani A, Shazeer N, Parmar N, et al. Attention is all you need. In: _Advances in Neural Information Processing Systems_. Curran Associates, Inc.; 2017.
*   20. Liu Z, Lin Y, Cao Y, et al. Swin transformer: hierarchical vision transformer using shifted windows. In: _Proceedings of the International Conference on Computer Vision_. IEEE; 2021:10012-10022.
*   21. Brown T, Mann B, Ryder N, et al. Language models are few-shot learners. In: _Advances in Neural Information Processing Systems_. Curran Associates, Inc.; 2020;33:1877-1901. \[[Google Scholar](https://scholar.google.com/scholar_lookup?Brown%20T,%20Mann%20B,%20Ryder%20N,%20et%20al.%20Language%20models%20are%20few-shot%20learners.%20In:%C2%A0Advances%20in%20Neural%20Information%20Processing%20Systems.%20Curran%20Associates,%20Inc.;%202020;33:1877-1901.)\]
*   22. Rampášek L, Galkin M, Dwivedi VP, et al. Recipe for a general, powerful, scalable graph transformer. In: _Advances in Neural Information Processing Systems_. Curran Associates, Inc.; 2022;35:14501-14515. \[[Google Scholar](https://scholar.google.com/scholar_lookup?Ramp%C3%A1%C5%A1ek%20L,%20Galkin%20M,%20Dwivedi%20VP,%20et%20al.%20Recipe%20for%20a%20general,%20powerful,%20scalable%20graph%20transformer.%20In:%C2%A0Advances%20in%20Neural%20Information%20Processing%20Systems.%20Curran%20Associates,%20Inc.;%202022;35:14501-14515.)\]
*   23. Wei Y, Liu W, Liu F, et al. LightGT: a light graph transformer for multimedia recommendation. In: _Proceedings of the 46th International ACM SIGIR Conference on Research and Development in Information Retrieval_. ACM; 2023:1508-1517.
*   24. Wu Q, Zhao W, Li Z, et al. NodeFormer: a scalable graph structure learning transformer for node classification. In: _Advances in Neural Information Processing Systems_. Curran Associates, Inc.; 2022;35:27387-27401. \[[Google Scholar](https://scholar.google.com/scholar_lookup?Wu%20Q,%20Zhao%20W,%20Li%20Z,%20et%20al.%20NodeFormer:%20a%20scalable%20graph%20structure%20learning%20transformer%20for%20node%20classification.%20In:%C2%A0Advances%20in%20Neural%20Information%20Processing%20Systems.%20Curran%20Associates,%20Inc.;%202022;35:27387-27401.)\]
*   25. Lu Y, Zhang C, Pei S, et al. WalkRanker: a unified pairwise ranking model with multiplerelations for item recommendation. In: _Proceedings of the AAAI Conference on Artificial Intelligence_. AAAI Press; 2018.
*   26. Tang J, Qu M, Wang M, et al. LINE: large-scale information network embedding. In: _Proceedings of the 24th International Conference on World Wide Web_. ACM; 2015:1067-1077.
*   27. Chen T, Kornblith S, Norouzi M, et al. A simple framework for contrastive learning of visual representations. In: _Proceedings of the International Conference on Machine Learning_. ACM; 2020:1597-1607.
*   28. Devlin J, Chang MW, Lee K, et al. BERT: pre-training of deep bidirectional transformers for language understanding. In: _Proceedings of the 2019 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies_. Curran Associates, Inc.; 2019:1:4171-4186. \[[Google Scholar](https://scholar.google.com/scholar_lookup?Devlin%20J,%20Chang%20MW,%20Lee%20K,%20et%20al.%20BERT:%20pre-training%20of%20deep%20bidirectional%20transformers%20for%20language%20understanding.%20In:%20Proceedings%20of%20the%202019%20Conference%20of%20the%20North%20American%20Chapter%20of%20the%20Association%20for%20Computational%20Linguistics:%20Human%20Language%20Technologies.%20Curran%20Associates,%20Inc.;%202019:1:4171-4186.)\]
*   29. Reimers N, Gurevych I. Sentence-BERT: sentence embeddings using Siamese BERT-networks. In: _Proceedings of the International Joint Conference on Natural Language Processing_. ACM; 2019:3980-3990.
*   30. Van der ML, Hinton G.  Visualizing data using t-SNE. J Mach Learn Res. 2008;9(11):2579-2605. \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=J%20Mach%20Learn%20Res&title=Visualizing%20data%20using%20t-SNE&volume=9&issue=11&publication_year=2008&pages=2579-2605&)\]
*   31. Perozzi B, Al-Rfou R, Skiena S. DeepWalk: online learning of social representations. In: _Proceedings of the 20th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining_. ACM; 2014:701-710.
*   32. Kipf TN, Welling M. Semi-supervised classification with graph convolutional networks. In: _Proceedings of the International Conference on Learning Representations_. Curran Associates, Inc.; 2017.
*   33. Hamilton W, Leskovec J. Inductive representation learning on large graphs. In: _Advances in Neural Information Processing Systems_. Curran Associates, Inc.; 2017:1024-1034.
*   34. Veličković P, Cucurull G, Casanova A, et al. Graph attention networks. In: _Proceedings of the International Conference on Learning Representations_. Curran Associates, Inc.; 2018.
*   35. Glorot X, Bengio Y. Understanding the difficulty of training deep feed forward neural networks. In: _Proceedings of the International Conference on Artificial Intelligence and Statistics_. PMLR; 2010:249-256.
*   36. Kingma DP, Ba J. Adam: a method for stochastic optimization. In: _Proceedings of the International Conference on Learning Representations_. Curran Associates, Inc.; 2015:1-16.
*   37. Shalom E, Goldstein A, Ariel E, et al.  Distributed application of guideline-based decision support through mobile devices: implementation and evaluation. Artif Intell Med.  2022;129:102324. \[[DOI](https://doi.org/10.1016/j.artmed.2022.102324)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/35659389/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=Artif%20Intell%20Med.&title=Distributed%20application%20of%20guideline-based%20decision%20support%20through%20mobile%20devices:%20implementation%20and%20evaluation&volume=129&publication_year=2022&pages=102324&pmid=35659389&doi=10.1016/j.artmed.2022.102324&)\]
*   38. Lee J, Park S, Cho MH, et al.  Development of a web-based care networking system to support visiting healthcare professionals in the community. BMC Health Serv Res.  2023;23:1427. \[[DOI](https://doi.org/10.1186/s12913-023-10434-6)\] \[[PMC free article](/articles/PMC10725602/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/38104086/)\] \[[Google Scholar](https://scholar.google.com/scholar_lookup?journal=BMC%20Health%20Serv%20Res.&title=Development%20of%20a%20web-based%20care%20networking%20system%20to%20support%20visiting%20healthcare%20professionals%20in%20the%20community&volume=23&publication_year=2023&pages=1427&pmid=38104086&doi=10.1186/s12913-023-10434-6&)\]
*   39. Lei Y, Wu D, Zhou T, et al. Meta-task prompting elicits embedding from large language models. arXiv, preprint arXiv:2402.18458, 2024, preprint: not peer reviewed. 10.48550/arXiv.2402.18458 \[[DOI](https://doi.org/10.48550/arXiv.2402.18458)\]
*   40. Benara V, Singh C, Morris JX, et al. Crafting interpretable embeddings by asking LLMs questions. arXiv, preprint arXiv:2405.16714, 2024, preprint: not peer reviewed. 10.48550/arXiv.2405.16714 \[[DOI](https://doi.org/10.48550/arXiv.2405.16714)\] \[[PMC free article](/articles/PMC12021422/)\] \[[PubMed](https://pubmed.ncbi.nlm.nih.gov/40276238/)\]

## Associated Data

_This section collects any data citations, data availability statements, or supplementary materials included in this article._

### Supplementary Materials

ocae327\_Supplementary\_Data

[ocae327\_supplementary\_data.zip](/articles/instance/12079649/bin/ocae327_supplementary_data.zip) (1.2MB, zip)

### Data Availability Statement

The caregiving intervention data presented in this study involve personally identifiable information of the participants. To protect their privacy, the data are not publicly available. However, de-identified data may be accessed upon request for researchers who meet the criteria for access to confidential data. Any interested party should directly contact the corresponding author to discuss data sharing possibilities and conditions. Requests will be reviewed on a case-by-case basis, and data may be provided subject to the necessary agreements and approvals.

* * *

Articles from Journal of the American Medical Informatics Association : JAMIA are provided here courtesy of **Oxford University Press**