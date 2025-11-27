<?php
namespace EcoRide;

use MongoDB\BSON\ObjectId;
use MongoDB\BSON\UTCDateTime;

class ReviewRepositoryMongo {
    private \MongoDB\Collection $col;

    public function __construct(Mongo $mongo) {
        $this->col = $mongo->collection('reviews');
    }

    /** @return string inserted id */
    public function create(array $data): string {
        $doc = [
            'ride_id'    => (int)($data['ride_id'] ?? 0),
            'rating'     => (int)($data['rating'] ?? 0),
            'comment'    => trim((string)($data['comment'] ?? '')),
            'user_email' => trim((string)($data['user_email'] ?? '')),
            'created_at' => new UTCDateTime(),
            'updated_at' => new UTCDateTime(),
        ];
        $res = $this->col->insertOne($doc);
        return (string)$res->getInsertedId();
    }

    public function findAllByRide(int $rideId): array {
        return $this->col->find(['ride_id' => $rideId], ['sort' => ['created_at' => -1]])->toArray();
    }

    public function findById(string $id): ?array {
        $doc = $this->col->findOne(['_id' => new ObjectId($id)]);
        return $doc ? $doc->getArrayCopy() : null;
    }

    /** @return int modified count */
    public function update(string $id, array $patch): int {
        $patch['updated_at'] = new UTCDateTime();
        $res = $this->col->updateOne(
            ['_id' => new ObjectId($id)],
            ['$set' => $patch]
        );
        return $res->getModifiedCount();
    }

    /** @return int deleted count */
    public function delete(string $id): int {
        $res = $this->col->deleteOne(['_id' => new ObjectId($id)]);
        return $res->getDeletedCount();
    }
}
