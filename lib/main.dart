import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ツーリング費用計算',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final _formKey = GlobalKey<FormState>();

  final _distanceController = TextEditingController();
  final _fuelEfficiencyController =
      TextEditingController(text: '30'); // km/L
  final _fuelPriceController =
      TextEditingController(text: '170'); // 円/L
  final _highwayCostController = TextEditingController(text: '0');
  final _otherCostController = TextEditingController(text: '0');
  final _cardRateController = TextEditingController(text: '1.0'); // %
  final _fuelPointRateController =
      TextEditingController(text: '1.0'); // %

  bool _isRoundTrip = true;

  CostResult? _result;

  @override
  void dispose() {
    _distanceController.dispose();
    _fuelEfficiencyController.dispose();
    _fuelPriceController.dispose();
    _highwayCostController.dispose();
    _otherCostController.dispose();
    _cardRateController.dispose();
    _fuelPointRateController.dispose();
    super.dispose();
  }

  void _calculate() {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final distanceOneWay =
        double.parse(_distanceController.text.replaceAll(',', ''));
    final fuelEfficiency =
        double.parse(_fuelEfficiencyController.text.replaceAll(',', ''));
    final fuelPrice =
        double.parse(_fuelPriceController.text.replaceAll(',', ''));

    final highwayCost = double.tryParse(
            _highwayCostController.text.replaceAll(',', '')) ??
        0;
    final otherCost =
        double.tryParse(_otherCostController.text.replaceAll(',', '')) ?? 0;

    final cardRatePercent =
        double.tryParse(_cardRateController.text.replaceAll('%', '')) ?? 0;
    final fuelPointRatePercent =
        double.tryParse(_fuelPointRateController.text.replaceAll('%', '')) ??
            0;

    final totalDistanceKm =
        _isRoundTrip ? distanceOneWay * 2.0 : distanceOneWay;

    if (totalDistanceKm <= 0 || fuelEfficiency <= 0 || fuelPrice <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('距離・燃費・ガソリン単価は0より大きい値を入力してください'),
        ),
      );
      return;
    }

    final fuelLiters = totalDistanceKm / fuelEfficiency;
    final fuelCost = fuelLiters * fuelPrice;
    final totalCost = fuelCost + highwayCost + otherCost;

    final cardRate = cardRatePercent / 100.0;
    final fuelPointRate = fuelPointRatePercent / 100.0;

    final cardPoints = totalCost * cardRate;
    final fuelPoints = fuelCost * fuelPointRate;
    final totalPoints = cardPoints + fuelPoints;
    final netCost = totalCost - totalPoints;

    setState(() {
      _result = CostResult(
        totalDistanceKm: totalDistanceKm,
        fuelLiters: fuelLiters,
        fuelCost: fuelCost,
        highwayCost: highwayCost,
        otherCost: otherCost,
        totalCost: totalCost,
        cardPoints: cardPoints,
        fuelPoints: fuelPoints,
        totalPoints: totalPoints,
        netCost: netCost,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ツーリング費用計算'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '基本情報',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _distanceController,
                        keyboardType:
                            const TextInputType.numberWithOptions(decimal: true),
                        decoration: const InputDecoration(
                          labelText: '走行距離（片道）',
                          suffixText: 'km',
                          border: OutlineInputBorder(),
                        ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return '距離を入力してください';
                          }
                          final v = double.tryParse(
                              value.trim().replaceAll(',', ''));
                          if (v == null || v <= 0) {
                            return '0より大きい数値を入力してください';
                          }
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      children: [
                        const Text('往復する？'),
                        Switch(
                          value: _isRoundTrip,
                          onChanged: (v) {
                            setState(() {
                              _isRoundTrip = v;
                            });
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fuelEfficiencyController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: '燃費',
                    suffixText: 'km/L',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return '燃費を入力してください';
                    }
                    final v =
                        double.tryParse(value.trim().replaceAll(',', ''));
                    if (v == null || v <= 0) {
                      return '0より大きい数値を入力してください';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fuelPriceController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'ガソリン単価',
                    suffixText: '円/L',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'ガソリン単価を入力してください';
                    }
                    final v =
                        double.tryParse(value.trim().replaceAll(',', ''));
                    if (v == null || v <= 0) {
                      return '0より大きい数値を入力してください';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                const Text(
                  'その他の費用',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _highwayCostController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: '高速料金（合計）',
                    suffixText: '円',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _otherCostController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'その他費用（フェリー・駐車場など）',
                    suffixText: '円',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'ポイント還元',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _cardRateController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'クレカ還元率',
                    suffixText: '%',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _fuelPointRateController,
                  keyboardType:
                      const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(
                    labelText: 'ガソリン系ポイント還元率',
                    suffixText: '%',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _calculate,
                    icon: const Icon(Icons.calculate),
                    label: const Text('計算する'),
                  ),
                ),
                const SizedBox(height: 24),
                if (_result != null) _ResultCard(result: _result!),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CostResult {
  final double totalDistanceKm;
  final double fuelLiters;
  final double fuelCost;
  final double highwayCost;
  final double otherCost;
  final double totalCost;
  final double cardPoints;
  final double fuelPoints;
  final double totalPoints;
  final double netCost;

  const CostResult({
    required this.totalDistanceKm,
    required this.fuelLiters,
    required this.fuelCost,
    required this.highwayCost,
    required this.otherCost,
    required this.totalCost,
    required this.cardPoints,
    required this.fuelPoints,
    required this.totalPoints,
    required this.netCost,
  });

  double get costPerKm => totalCost / totalDistanceKm;
  double get netCostPerKm => netCost / totalDistanceKm;
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({required this.result});

  final CostResult result;

  String _yen(double v) => v.toStringAsFixed(0);
  String _km(double v) => v.toStringAsFixed(1);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '結果',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Text('総走行距離: ${_km(result.totalDistanceKm)} km'),
            Text('ガソリン使用量: ${_km(result.fuelLiters)} L'),
            const SizedBox(height: 8),
            Text('ガソリン代: ${_yen(result.fuelCost)} 円'),
            Text('高速料金: ${_yen(result.highwayCost)} 円'),
            Text('その他費用: ${_yen(result.otherCost)} 円'),
            const Divider(height: 24),
            Text('合計費用: ${_yen(result.totalCost)} 円'),
            const SizedBox(height: 8),
            Text('クレカ還元相当: ${_yen(result.cardPoints)} 円'),
            Text('ガソリン系ポイント: ${_yen(result.fuelPoints)} 円'),
            Text('ポイント合計: ${_yen(result.totalPoints)} 円'),
            const Divider(height: 24),
            Text('実質負担額: ${_yen(result.netCost)} 円'),
            Text('1kmあたり費用: '
                '${result.costPerKm.toStringAsFixed(1)} 円/km'),
            Text('1kmあたり実質負担: '
                '${result.netCostPerKm.toStringAsFixed(1)} 円/km'),
          ],
        ),
      ),
    );
  }
}
