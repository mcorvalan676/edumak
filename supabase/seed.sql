-- Datos demo de EduMap.
insert into institutions(name,address,lat,lng)
values ('Instituto EduMap Demo','Linares, Maule, Chile',-35.848,-71.597)
on conflict do nothing;

insert into buildings(institution_id,name)
select id,'Edificio Principal' from institutions where name='Instituto EduMap Demo'
and not exists(select 1 from buildings b where b.name='Edificio Principal');

insert into floors(building_id,level,name)
select b.id,1,'Primer piso' from buildings b where b.name='Edificio Principal'
and not exists(select 1 from floors f where f.building_id=b.id and f.level=1);

insert into floors(building_id,level,name)
select b.id,2,'Segundo piso' from buildings b where b.name='Edificio Principal'
and not exists(select 1 from floors f where f.building_id=b.id and f.level=2);

insert into navigation_nodes(name,floor_id,lat,lng,x,y)
select 'Entrada principal',f.id,-35.8480,-71.5970,0,0 from floors f
where f.name='Primer piso' and not exists(select 1 from navigation_nodes n where n.name='Entrada principal');

insert into navigation_nodes(name,floor_id,lat,lng,x,y)
select 'Biblioteca',f.id,-35.8481,-71.5970,1,0 from floors f
where f.name='Primer piso' and not exists(select 1 from navigation_nodes n where n.name='Biblioteca');

insert into navigation_nodes(name,floor_id,lat,lng,x,y)
select 'Laboratorio',f.id,-35.8482,-71.5970,2,0 from floors f
where f.name='Primer piso' and not exists(select 1 from navigation_nodes n where n.name='Laboratorio');

insert into navigation_nodes(name,floor_id,lat,lng,x,y)
select 'Ascensor',f.id,-35.8481,-71.5969,1,1 from floors f
where f.name='Primer piso' and not exists(select 1 from navigation_nodes n where n.name='Ascensor');

insert into navigation_nodes(name,floor_id,lat,lng,x,y)
select 'Sala 205',f.id,-35.8481,-71.5968,1,2 from floors f
where f.name='Segundo piso' and not exists(select 1 from navigation_nodes n where n.name='Sala 205');

insert into spaces(name,description,space_type,floor_id,node_id)
select n.name,'Espacio demo de EduMap','sala',n.floor_id,n.id
from navigation_nodes n
where not exists(select 1 from spaces s where s.name=n.name);

insert into navigation_edges(from_node_id,to_node_id,weight,accessible)
select a.id,b.id,1,true from navigation_nodes a, navigation_nodes b
where a.name='Entrada principal' and b.name='Biblioteca'
and not exists(select 1 from navigation_edges e where e.from_node_id=a.id and e.to_node_id=b.id);

insert into navigation_edges(from_node_id,to_node_id,weight,accessible)
select a.id,b.id,1,true from navigation_nodes a, navigation_nodes b
where a.name='Biblioteca' and b.name='Laboratorio'
and not exists(select 1 from navigation_edges e where e.from_node_id=a.id and e.to_node_id=b.id);

insert into navigation_edges(from_node_id,to_node_id,weight,accessible)
select a.id,b.id,1,true from navigation_nodes a, navigation_nodes b
where a.name='Biblioteca' and b.name='Ascensor'
and not exists(select 1 from navigation_edges e where e.from_node_id=a.id and e.to_node_id=b.id);

insert into navigation_edges(from_node_id,to_node_id,weight,accessible)
select a.id,b.id,1,true from navigation_nodes a, navigation_nodes b
where a.name='Ascensor' and b.name='Sala 205'
and not exists(select 1 from navigation_edges e where e.from_node_id=a.id and e.to_node_id=b.id);
