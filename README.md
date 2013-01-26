VisualJS
========

利用chrome的debugger获取javascript的信息并进行可视化

##Object Graph

idea来自于[Learning Javascript with Object Graphs][0], Object Graph在结构上是图, 总体上成层级分布, 故采用Hierarchical Drawing Algorithm来绘制该图, 算法总共分为4大部分

**acyclic**消除图中的回路

- 在图上进行DFS, 发现回溯的边标记为reversed, 并调用改边的source和target节点. 算法结束后根据reversed标记恢复

**rank**对节点进行分层, 每个节点都隶属于某一层

- 初始化节点的rank值(initRank), 维护一个节点的优先队列和minRank, 优先度由节点的入边数目决定(入边越少优先度越高). 每次迭代取出优先度最高的节点(入边数均为零, 故该节点的minRank不会再更新, 可得出改节点rank), 删除其出边(target节点入边数目--), 并更新target节点的minRank(当前节点的rank + minLen, minLen默认为1, 可根据需求调整某边的minLen)
- 改进节点的rank值(feasibleRank), 这里需要对图进行一定处理, minLen由两个节点之间所有的边(无论方向)的最大值决定. 边的权值为rank初始值之差再减去minLen, 在此基础上利用prim求出最小生成树, 即可决定节点的最终rank值

**order**在每一层内部调整节点顺序以减少边的交叉

- 设定算法的迭代次数(默认为24), 每次迭代都有可能减少边的交叉次数. 算法逐rank进行, 针对每个node, 求出对面(由于算法会根据迭代次数的奇偶性来调整访问rank的方向, 所谓对面即指当前访问方式下, 具体对应为上层rank或者下层rank)相连节点位置的平均数, 并以此对rank内的node排序. 迭代次数以奇偶划分, 一次从上至下, 一次从下至上重新排序每个rank内的节点. 该算法进行前需要通过添加dummy nodes保证edge最多横跨两个点, 这个预处理没有在算法内完成, 需在layout内进行
- 在求两层rank之间边的交叉次数时运用了accumulator tree算法

**position**决定节点的最终坐标

- 定义两个dummy节点之间的边为inner segment. 找出图中的type1的conflict(inner segment与非inner segment之间存在交叉). 为了保证inner segment的vertical, 标记非inner segment为conflict. 寻找conflict的方法为顺序访问某一rank内的节点, 遇到dummy节点暂停, 确定该inner segment在previous rank中的邻接节点, 由于在循环的时候记录着上一条inner segment在previous rank中的邻接节点, 由此可以确定一个范围(k0, k1). 此时从上一次的dummy节点开始顺序访问节点知道当前dummy节点的位置, 并逐次确定每个节点在previous rank中的邻接节点, 如果不在(k0, k1)的范围内, 即表明与inner segment发生交叉, 从而表明某两个节点之间存在conflict, 并在后续算法中无视这些conflict边
- 决定conflict之后就可以进行vertical alignment了(考虑四种搭配, 左上+右上+左下+右下), 所谓的vertical alignment即确定图中的block: 排在一条直线上的连通节点集合. 标记节点的align指向block中的下一个节点, 最后一个节点指向初始节点, 并且block中的每个节点都包含root信息指向该block的root
- 确定vertical alignment之后就进行horizontal compacting了, 此处定义了一个class的概念(见论文配图), 每个class都有sink, 显然, sink必然存在class的左上角. 首先确定所有block的root相对于class的sink的位移(placeBlock), root的位置由其左边的block中的节点决定, 满足左边block中所有节点的距离约束即可, 如此递归调用placeBlock即可. 此外, 为了compact全图的结构, 还求出了class之间的shift信息, 即两个class如若相邻, 那相邻的block就需满足距离约束, shift有可能拉近也有可能拉远class之间的距离
- 由于之间求了四种搭配(左上+右上+左下+右下)下的layout, 取得其中最为相近的两种并取平均值, 即可得到最后的坐标

[0]: http://howtonode.org/object-graphs




